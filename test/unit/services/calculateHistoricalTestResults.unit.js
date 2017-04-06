'use strict';

describe('calculateHistoricalTestResult'.bold.underline.blue, function () {
  var calculateHistoricalTestResult;
  var keypather;
  var jesusBirthday = '0001-01-01T00:00:00Z';

  function setup() {
    angular.mock.module('app');
    angular.mock.inject(function (
      _keypather_,
      _calculateHistoricalTestResult_
    ) {
      calculateHistoricalTestResult = _calculateHistoricalTestResult_;
      keypather = _keypather_;
    });
  }

  beforeEach(setup);

  describe('calculateHistoricalTestResult', function () {
    it('addResults build stop epoch', function () {
      var tests = [{
        build: {
          stop: jesusBirthday,
          failed: false
        },
        application: {
          exitCode: 0,
          stop: new Date()
        }
      }];
      calculateHistoricalTestResult.addResults(tests);

      expect(calculateHistoricalTestResult.isUnknown(tests[0].testState)).to.be.truthy;
    });

    it('addResults build failed', function () {
      var tests = [{
        build: {
          stop: new Date(),
          failed: true
        },
        application: {
          exitCode: 0,
          stop: new Date()
        }
      }];
      calculateHistoricalTestResult.addResults(tests);

      expect(calculateHistoricalTestResult.isFailed(tests[0].testState)).to.be.truthy;
    });

    it('addResults exit code not 0', function () {
      var tests = [{
        build: {
          stop: new Date(),
          failed: false
        },
        application: {
          exitCode: 10,
          stop: new Date()
        }
      }];
      calculateHistoricalTestResult.addResults(tests);

      expect(calculateHistoricalTestResult.isFailed(tests[0].testState)).to.be.truthy;
    });

    it('addResults application stop epoch', function () {
      var tests = [{
        build: {
          stop: new Date(),
          failed: false
        },
        application: {
          exitCode: 0,
          stop: jesusBirthday
        }
      }];
      calculateHistoricalTestResult.addResults(tests);

      expect(calculateHistoricalTestResult.isUnknown(tests[0].testState)).to.be.truthy;
    });

    it('addResults passed', function () {
      var tests = [{
        build: {
          stop: new Date(),
          failed: false
        },
        application: {
          exitCode: 0,
          stop: new Date()
        }
      }];
      calculateHistoricalTestResult.addResults(tests);

      expect(calculateHistoricalTestResult.isUnknown(tests[0].testState)).to.be.truthy;
    });
  });
});
