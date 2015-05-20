'use strict';

require('app')
  .factory('deleteTransformRule', deleteTransformRule);

require('app')
  .factory('createTransformRule', createTransformRule);

require('app')
  .factory('testRenameTransformRule', testRenameTransformRule);
require('app')
  .factory('testReplaceTransformRule', testReplaceTransformRule);

require('app')
  .factory('parseDiffResponse', parseDiffResponse);

function parseDiffResponse(
  diffParse
) {
  return function (fullDiff) {
    var totalParse = diffParse(fullDiff);
    var groupByLineNumbers = {};
    return Object.keys(totalParse).map(function (fileKey) {
      var parsed = totalParse[fileKey];
      parsed.modifications.forEach(function (modification) {
        if (!groupByLineNumbers[modification.ln]) {
          groupByLineNumbers[modification.ln] = {
            additions: [],
            deletions: []
          };
        }
        if (modification.del) {
          groupByLineNumbers[modification.ln].deletions.push(modification);
        } else {
          groupByLineNumbers[modification.ln].additions.push(modification);
        }
      });
      parsed.changes = Object.keys(groupByLineNumbers).map(function (key) {
        return groupByLineNumbers[key];
      });
      if (parsed.from === parsed.to) {
        delete parsed.to;
      } else {
        parsed.to = parsed.to.replace('+++ ', '');
      }
      parsed.from = parsed.from.replace('--- ', '');
      return parsed;
    });
  };
}

function createTransformRule(
  promisify
) {
  return function (appCodeVersionModel, rule, oldRule) {
    var rules = appCodeVersionModel.attrs.transformRules || {};
    if (rule.action === 'replace') {
      if (oldRule) {
        rules.replace = rules.replace.filter(function (needle) {
          return !angular.equals(needle, rule);
        });
      }
      rules.replace = rules.replace.push({
        action: 'replace',
        search: rule.oldValue,
        replace: rule.newValue
      });
    } else if (rule.action === 'rename') {
      if (oldRule) {
        rules.rename = rules.rename.filter(function (needle) {
          return !angular.equals(needle, rule);
        });
      }
      rules.rename = rules.rename.push({
        action: 'rename',
        source: rule.oldValue,
        dest: rule.newValue
      });
    } else {
      rules.exclude = rule;
    }

    return promisify(appCodeVersionModel, 'update')({
      transformRules: rules
    });

  };
}

function testRenameTransformRule(
  $q,
  user
) {
  return function (appCodeVersionModel, rule) {
    var defer = $q.defer();
    function callback(err, res, body) {
      if (err) { return defer.reject(err); }
      console.log(body);
      defer.resolve(body.results);
    }
    rule.action = 'rename';
    user.client.post(appCodeVersionModel.urlPath + '/' + appCodeVersionModel.id() +
      '/actions/applyTransformRules', {
        json: {
          action: 'rename',
          source: rule.oldValue,
          dest: rule.newValue
        }
      }, callback);
    return defer.promise;
  };
}


function testReplaceTransformRule(
  $q,
  parseDiffResponse,
  user
) {
  return function (appCodeVersionModel, rule) {
    var defer = $q.defer();

    function callback(err, res, body) {
      if (err) { return defer.reject(err); }
      var parsed = parseDiffResponse(body.diff);
      console.log(parsed);
      defer.resolve(parsed);
    }

    user.client.post(appCodeVersionModel.urlPath + '/' + appCodeVersionModel.id() +
      '/actions/applyTransformRules', {
        json: {
          action: 'replace',
          search: rule.oldValue,
          replace: rule.newValue
        }
      }, callback);
    return defer.promise;
  };
}

function deleteTransformRule(
  $q,
  promisify
) {
  return function (appCodeVersionModel, rule) {
    var defer = $q.defer();
    var rules = appCodeVersionModel.attrs.transformRules;
    if (rules) {
      if (rule.action === 'replace') {
        rules.replace = rules.replace.filter(function (needle) {
          return !angular.equals(needle, rule);
        });
      } else if (rule.action === 'rename') {
        rules.rename = rules.rename.filter(function (needle) {
          return !angular.equals(needle, rule);
        });
      } else {
        rules.exclude = rules.exclude.filter(function (needle) {
          return !angular.equals(needle, rule);
        });
      }

      return promisify(appCodeVersionModel, 'update')({
        transformRules: rules
      });
    }
    defer.reject(new Error('No rules to delete'));
    return defer.promise;
  };
}