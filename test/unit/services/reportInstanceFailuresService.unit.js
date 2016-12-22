'use strict';

var $rootScope;
var $q;
var keypather;
var apiMocks = require('../apiMocks/index');
var runnable = window.runnable;
var reportInstanceFailures;

describe.only('reportInstanceFailures'.bold.underline.blue, function () {

  var reportMock;
  beforeEach(function setup() {
    reportMock = {
      critical: sinon.stub()
    };
    runnable.reset(apiMocks.user);
    angular.mock.module('app', function ($provide) {
      $provide.value('report', reportMock);
    });
    angular.mock.inject(function (
      _$rootScope_,
      _$q_,
      _reportInstanceFailures_,
      _keypather_
    ) {
      $q = _$q_;
      $rootScope = _$rootScope_;
      $rootScope.$broadcast = sinon.stub();
      reportInstanceFailures = _reportInstanceFailures_;
      keypather = _keypather_;
    });
    $rootScope.$digest();
  });

  describe('testing', function () {
    it('should report the error', function () {
      var error = {
        message: 'I am an error'
      };
      reportInstanceFailures(error);
      sinon.assert.calledOnce(reportMock.critical);
      sinon.assert.calledWith(reportMock.critical, error.message, {
        err: error
      });
    });
    it('should not report the error if it matches any of the errorsToNotReport', function () {
      var error = {
        message: 'instance with lowerName already exists'
      };
      reportInstanceFailures(error);
      sinon.assert.notCalled(reportMock.critical);
    });
  });
});
