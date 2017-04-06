'use strict';

require('app')
  .factory('calculateHistoricalTestResult', calculateHistoricalTestResult);

var PASSED = 'passed';
var FAILED = 'failed';
var UNKNOWN = 'unknown';
var jesusBirthday = '0001-01-01T00:00:00Z';

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
    isValidState: function(state) {
      return state === PASSED || state === FAILED || state === UNKNOWN;
    },
    addResults: function (tests) {
      tests.forEach(function(test) {
        if (test && keypather.get(test, 'build.stop') !== jesusBirthday) {
          if (keypather.get(test, 'build.failed') || keypather.get(test, 'application.exitCode') > 0) {
            test.testState = FAILED;
          } else if (keypather.get(test,'application.exitCode') === 0 && keypather.get(test,'application.stop') !== jesusBirthday) {
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
