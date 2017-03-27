'use strict';

require('app')
  .controller('BranchTestListController', BranchTestListController);
/**
 * controller BranchTestListController
 * @ngInject
 */
function BranchTestListController(
  fetchCommitData,
  fetchInstanceTestHistory
) {
  var BTLC = this;
  const TEST_STATES = {
    PASSED: 1,
    FAILED: 2,
    UNKNOWN: 3
  };

  BTLC.branch = fetchCommitData.activeBranch(BTLC.appCodeVersion);

  fetchInstanceTestHistory(BTLC.instance.attrs.id)
    .then(function(tests) {
      BTLC.branch.commits.models.forEach(function(com) {
        var index = tests.findIndex(function(test) {
          return com.attrs.sha === test.commitSha;
        });

        if (index >= 0) {
          addTestResults(tests[index], com);
          tests.splice(index, 1);
        }

        if (BTLC.appCodeVersion.attrs.commit === com.attrs.sha) {
          BTLC.commit = com;
        }
      });

      return;
    });

  function addTestResults(test, com) {
    if (test.build.stop !== new Date(0) && !test.build.failed) {
      if (test.application.exitCode > 0) {
        com.attrs.test = TEST_STATES.FAILED;
      } else if (test.application.exitCode === 0 && test.application.stop !== new Date(0)) {
        com.attrs.test = TEST_STATES.PASSED;
      }
    }

    if (!com.attrs.test) {
      com.attrs.test = TEST_STATES.UNKNOWN;
    }
  }
}
