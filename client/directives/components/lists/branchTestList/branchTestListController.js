'use strict';

require('app')
  .controller('BranchTestListController', BranchTestListController);
/**
 * controller BranchTestListController
 * @ngInject
 */
function BranchTestListController(
  fetchCommitData,
  fetchInstanceTestHistory,
  calculateHistoricalTestResult,
  keypather
) {
  var BTLC = this;

  BTLC.appCodeVersion = BTLC.instance.contextVersion.getMainAppCodeVersion();
  BTLC.branch = fetchCommitData.activeBranch(BTLC.appCodeVersion);

  fetchInstanceTestHistory(BTLC.instance.attrs.id)
    .then(function(tests) {
      return calculateHistoricalTestResult(tests);
    }).then(function(tests) {
      var testHash = {};
      tests.forEach(function(test) {
        testHash[test.commitSha] = test;
      });

      BTLC.branch.commits.models.forEach(function(commit) {
        commit.test = keypather.get(testHash[commit.attrs.sha], 'testState');

        if (BTLC.appCodeVersion.attrs.commit === commit.attrs.sha) {
          BTLC.commit = commit;
        }
      });

      return;
    });
}
