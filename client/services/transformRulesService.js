'use strict';

require('app')
  .factory('deleteTransformRule', deleteTransformRule);

require('app')
  .factory('createTransformRule', createTransformRule);

require('app')
  .factory('moveTransformRules', moveTransformRules);

require('app')
  .factory('testRenameTransformRule', testRenameTransformRule);
require('app')
  .factory('testReplaceTransformRule', testReplaceTransformRule);
require('app')
  .factory('testAllTransformRules', testAllTransformRules);

require('app')
  .factory('parseDiffResponse', parseDiffResponse);


require('app')
  .factory('populateRulesWithWarningsAndDiffs', populateRulesWithWarningsAndDiffs);

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
      parsed.to = parsed.to.replace('+++ ', '');
      parsed.from = parsed.from.replace('--- ', '');
      if (parsed.from === parsed.to) {
        delete parsed.to;
      }
      return parsed;
    });
  };
}

function createTransformRule(
  promisify
) {
  return function (appCodeVersionModel, rule, oldRule) {
    var rules = appCodeVersionModel.attrs.transformRules || {};
    if (rule.action) {
      if (rule.oldRule) {
        rules[rule.action] = rules[rule.action].filter(function (needle) {
          return needle._id === rule._id;
        });
      }
      rules[rule.action].push(rule);
    } else {
      rules.exclude = rule;
    }

    return promisify(appCodeVersionModel, 'update')({
      transformRules: rules
    });

  };
}

function moveTransformRules(
  promisify
) {
  return function (appCodeVersionModel, newRules, action) {
    var rules = appCodeVersionModel.attrs.transformRules || {};
    rules[action] = newRules;

    return promisify(appCodeVersionModel, 'update')({
      transformRules: rules
    });

  };
}


function testAllTransformRules(
  $q,
  user
) {
  return function (appCodeVersionModel) {
    var defer = $q.defer();
    function callback(err, res, body) {
      if (err) { return defer.reject(err); }
      defer.resolve(body);
    }
    if (appCodeVersionModel) {
      user.client.post(appCodeVersionModel.urlPath + '/' + appCodeVersionModel.id() +
        '/actions/applyTransformRules', callback);
    } else {
      defer.resolve();
    }
    return defer.promise;
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
      '/actions/testTransformRule', {
        json: rule
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
      if (body.diffs) {
        var parsed = parseDiffResponse(Object.keys(body.diffs).reduce(function (total, key) {
          return total + body.diffs[key];
        }, ''));
        defer.resolve(parsed);
      } else {
        defer.reject();
      }
    }
    rule.action = 'replace';
    user.client.post(appCodeVersionModel.urlPath + '/' + appCodeVersionModel.id() +
      '/actions/testTransformRule', {
        json: rule
      }, callback);
    return defer.promise;
  };
}

function populateRulesWithWarningsAndDiffs(
  hasKeypaths
) {
  return function (ruleList, transformResults) {
    if (Array.isArray(ruleList)) {
      ruleList.forEach(function (replaceRule) {
        var found = transformResults.find(hasKeypaths({
          'rule._id': replaceRule._id
        }));
        if (found) {
          replaceRule.warnings = found.warnings;
          replaceRule.diffs = parseDiffResponse(Object.keys(found.diffs).reduce(function (total, key) {
            return total + found.diffs[key];
          }, ''));
        }
      });
      return ruleList;
    }
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