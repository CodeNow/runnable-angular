'use strict';

describe('serviceGetInstancesClasses'.bold.underline.blue, function () {
  var stateMock;
  var instanceMock;
  var getInstanceClasses;

  beforeEach(function () {
    stateMock = {
      params: {
        instanceName: 'instanceName'
      }
    };
    instanceMock = {
      getRepoName: sinon.stub().returns('1234'),
      isMigrating: sinon.stub().returns(false),
      attrs: {
        name: 'instanceName'
      },
      status: sinon.stub().returns('running')
    };
  });

  beforeEach(function () {
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('$state', stateMock);
    });

    angular.mock.inject(function (_getInstanceClasses_) {
      getInstanceClasses = _getInstanceClasses_;
    });
  });

  it('should return orange if migrating', function () {
    instanceMock.isMigrating.returns(true);
    var testResults = getInstanceClasses(instanceMock);
    expect(testResults).to.equal('orange');
  });

  it('should return empty object if no instance', function () {
    var testResults = getInstanceClasses();
    expect(testResults).to.deep.equal({});
  });

  it('should be active if state instance name matches current instance', function () {
    var testResults = getInstanceClasses(instanceMock);
    expect(testResults.active).to.equal(true);
  });

  it('should not be active if state instance name does not match current instance', function () {
    instanceMock.attrs.name = 'foo';
    var testResults = getInstanceClasses(instanceMock);
    expect(testResults.active).to.equal(false);
  });

  describe('when testing', function () {
    beforeEach(function () {
      instanceMock.attrs.isTesting = true;
      instanceMock.attrs.isTestReporter = true;
    });

    var testMap = {
      'stopped': 'passed',
      'crashed': 'failed',
      'running': 'orange',
      'buildFailed': 'red',
      'building': 'orange',
      'neverStarted': 'red',
      'unknown': '',
      'starting': 'orange',
      'stopping': 'green'
    };

    Object.keys(testMap).forEach(function (key) {
      var testValue = testMap[key];
      describe('when status is ' + key, function () {
        beforeEach(function () {
          instanceMock.status.returns(key);
        });
        it('should return ' + testValue, function () {
          var testResults = getInstanceClasses(instanceMock);
          expect(testResults[testValue]).to.equal(true);
        });
      });
    });
  });

  describe('when not testing', function () {
    beforeEach(function () {
      instanceMock.attrs.isTesting = false;
    });

    var testMap = {
      'stopped': '',
      'crashed': 'red',
      'running': 'green',
      'buildFailed': 'red',
      'building': 'orange',
      'neverStarted': 'red',
      'unknown': '',
      'starting': 'orange',
      'stopping': 'green'
    };

    Object.keys(testMap).forEach(function (key) {
      var testValue = testMap[key];
      describe('when status is ' + key, function () {
        beforeEach(function () {
          instanceMock.status.returns(key);
        });
        it('should return ' + testValue, function () {
          var testResults = getInstanceClasses(instanceMock);
          expect(testResults[testValue]).to.equal(true);
        });
      });
    });
  });
});
