'use strict';

require('app')
  .factory('calculateHistoricalTestResult', calculateHistoricalTestResult);

function calculateHistoricalTestResult(
  keypather
) {
  return function (tests) {
    var TEST_STATES = {
      PASSED: 'passed',
      FAILED: 'failed',
      UNKNOWN: ''
    };

    tests.forEach(function(test) {
      if (test && keypather.get(test, 'build.stop').valueOf() !== new Date(0).valueOf()) {
        if (keypather.get(test, 'build.failed') || keypather.get(test, 'application.exitCode') > 0) {
          test.testState = TEST_STATES.FAILED;
        } else if (keypather.get(test,'application.exitCode') === 0 && keypather.get(test,'application.stop').valueOf() !== new Date(0).valueOf()) {
          test.testState =  TEST_STATES.PASSED;
        }
      }

      if (!test.testState) {
        test.testState = TEST_STATES.UNKNOWN
      }
    })

    return tests;
  };
}
