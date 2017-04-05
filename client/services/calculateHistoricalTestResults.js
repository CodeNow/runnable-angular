'use strict';

require('app')
  .factory('calculateHistoricalTestResult', calculateHistoricalTestResult);

var PASSED = 'passed';
var FAILED = 'failed';
var UNKNOWN = 'unknown';

function calculateHistoricalTestResult(
  keypather
) {
  return {
    isPassed: function(state) {
      return state === PASSED;
    },
    isFailed: function(state) {
      return state === FAILED;
    },
    isUnknown: function(state) {
      return state === UNKNOWN;
    },
    addResults: function (tests) {
      tests.forEach(function(test) {
        if (test && keypather.get(test, 'build.stop.valueOf()') !== new Date(0).valueOf()) {
          if (keypather.get(test, 'build.failed') || keypather.get(test, 'application.exitCode') > 0) {
            test.testState = FAILED;
          } else if (keypather.get(test,'application.exitCode') === 0 &&
              keypather.get(test,'application.stop.valueOf()') !== new Date(0).valueOf()) {
            test.testState =  PASSED;
          }
        }

        if (!test.testState) {
          test.testState = UNKNOWN;
        }
      });

      return tests;
    }
  };
}
