'use strict';

require('app')
  .factory('deleteTransformRule', deleteTransformRule)
  .factory('createTransformRule', createTransformRule)
  .factory('moveTransformRules', moveTransformRules)
  .factory('testRenameTransformRule', testRenameTransformRule)
  .factory('testReplaceTransformRule', testReplaceTransformRule)
  .factory('testAllTransformRules', testAllTransformRules)
  .factory('parseDiffResponse', parseDiffResponse)
  .factory('populateRulesWithWarningsAndDiffs', populateRulesWithWarningsAndDiffs);

function checkErrorCallback(reject, cb) {
  return function (err, res, body) {
    if (body.message) {
      reject(new Error(body.message));
    } else {
      cb(res, body);
    }
  };
}

function parseDiffResponse(
  diffParse
) {
  return function (fullDiff) {
    var totalParse = diffParse(fullDiff);
    return totalParse.map(function (parsed) {
      var groupByLineNumbers = {};
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
  return function (appCodeVersionModel, rule) {
    var rules = appCodeVersionModel.attrs.transformRules || {};
    if (rule.action) {
      if (rule.oldRule) {
        rules[rule.action] = rules[rule.action].filter(function (needle) {
          return needle._id !== rule.oldRule._id;
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
    return $q(function (resolve, reject) {
      if (appCodeVersionModel) {
        user.client.post(appCodeVersionModel.urlPath + '/' + appCodeVersionModel.id() +
          '/actions/applyTransformRules',
          checkErrorCallback(reject, function callback(res, body) {
            resolve(body);
          }));
      } else {
        resolve();
      }
    });
  };
}

function testRenameTransformRule(
  $q,
  user
) {
  return function (appCodeVersionModel, rule) {
    return $q(function (resolve, reject) {
      rule.action = 'rename';
      user.client.post(appCodeVersionModel.urlPath + '/' + appCodeVersionModel.id() +
        '/actions/testTransformRule', {
          json: rule
        }, checkErrorCallback(reject, function callback(res, body) {
          resolve(body.nameChanges);
        }));
    });
  };
}


function testReplaceTransformRule(
  $q,
  parseDiffResponse,
  user
) {
  return function (appCodeVersionModel, rule) {
    return $q(function (resolve, reject) {
      rule.action = 'replace';
      user.client.post(appCodeVersionModel.urlPath + '/' + appCodeVersionModel.id() +
        '/actions/testTransformRule', {
          json: rule
        }, checkErrorCallback(reject, function callback(res, body) {
          if (body.diffs) {
            var parsed = parseDiffResponse(Object.keys(body.diffs).reduce(function (total, key) {
              return total + body.diffs[key];
            }, ''));
            resolve(parsed);
          } else {
            reject();
          }
        }));
    });
  };
}

function populateRulesWithWarningsAndDiffs(
  hasKeypaths,
  parseDiffResponse
) {
  return function (ruleList, transformResults) {
    if (Array.isArray(ruleList) && Array.isArray(transformResults)) {
      ruleList.forEach(function (replaceRule) {
        var found = transformResults.find(hasKeypaths({
          'rule._id': replaceRule._id
        }));
        if (found) {
          replaceRule.warnings = found.warnings;
          replaceRule.nameChanges = found.nameChanges;
          var combinedDiff = Object.keys(found.diffs).reduce(function (total, key) {
            return total + found.diffs[key];
          }, '');
          replaceRule.diffs = parseDiffResponse(combinedDiff);
        }
      });
    }
    return ruleList;
  };
}

function deleteTransformRule(
  $q,
  promisify
) {
  return function (appCodeVersionModel, rule) {
    var rules = appCodeVersionModel.attrs.transformRules;
    if (rules) {
      rules[rule.action] = rules[rule.action].filter(function (needle) {
        return needle._id !== rule._id;
      });

      return promisify(appCodeVersionModel, 'update')({
        transformRules: rules
      });
    }
    return $q.reject(new Error('No rules to delete'));
  };
}