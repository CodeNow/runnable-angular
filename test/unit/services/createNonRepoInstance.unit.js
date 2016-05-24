'use strict';

describe('createNonRepoInstance'.bold.underline.blue, function () {
  var createNonRepoInstance;
  var $q;
  var $rootScope;
  var keypather;

  var createAndBuildNewContainerStub;
  var copySourceInstanceStub;
  var eventTrackingStub;

  var instanceName;
  var sourceInstance;
  var isolation;
  var instanceToForkName;

  function initState() {
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.factory('createAndBuildNewContainer', function ($q) {
        createAndBuildNewContainerStub = sinon.stub().returns($q.when({}));
        return createAndBuildNewContainerStub;
      });
      $provide.factory('copySourceInstance', function ($q) {
        copySourceInstanceStub = sinon.stub().returns($q.when({}));
        return copySourceInstanceStub;
      });
      $provide.factory('eventTracking', function ($q) {
        eventTrackingStub = {
          createdNonRepoContainer: sinon.stub()
        };
        return eventTrackingStub;
      });
      instanceName = 'HelloWorld';
      sourceInstance = {
        attrs: {
          name: 'hello'
        }
      };
      isolation = {};
      instanceToForkName = 'RethinkDB';
    });

    angular.mock.inject(function (_createNonRepoInstance_, _$q_, _$rootScope_, _keypather_) {
      createNonRepoInstance = _createNonRepoInstance_;
      $q = _$q_;
      keypather = _keypather_;
      $rootScope = _$rootScope_;
      keypather.set($rootScope, 'dataApp.data.activeAccount', 'CodeNow');
    });
  }
  beforeEach(initState);

  it('should copy the source instance', function () {
    createNonRepoInstance(instanceName, sourceInstance);
    $rootScope.$digest();
    sinon.assert.calledOnce(copySourceInstanceStub);
    sinon.assert.calledWith(copySourceInstanceStub, 'CodeNow', sourceInstance, instanceName);
  });

  it('should create and build the new container', function () {
    createNonRepoInstance(instanceName, sourceInstance);
    $rootScope.$digest();
    sinon.assert.calledOnce(createAndBuildNewContainerStub);
    sinon.assert.calledWith(createAndBuildNewContainerStub, sinon.match.any, instanceName);
  });

  it('should create and build the new container with isolation', function () {
    createNonRepoInstance(instanceName, sourceInstance, isolation);
    $rootScope.$digest();
    sinon.assert.calledOnce(createAndBuildNewContainerStub);
    sinon.assert.calledWith(createAndBuildNewContainerStub, sinon.match.any, instanceName, { isolation: isolation });
  });
});
