/*global runnable:true */
'use strict';

var $controller;
var $rootScope;
var $scope;
var $compile;
var $q;
var keypather;
var $timeout;

describe('InstanceNavigationController'.bold.underline.blue, function () {
  var instanceNavigationController;
  var promisifyStub;
  var mockInstance;
  var mockState;
  var mockModalService;
  var modalCloseReturn;
  var locationStub;
  var createIsolationStub;
  var fetchInstancesByPodStub;
  var mockFetchInstancesByPodResults;
  var demoFlowServiceStub;

  function setup() {
    angular.mock.module('app', function ($provide) {
      // Make promisify actually easy to work with...
      $provide.factory('promisify', function ($q) {
        promisifyStub = sinon.spy(function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(obj, arguments));
          };
        });
        return promisifyStub;
      });
      $provide.value('$state', mockState);
      $provide.factory('ModalService', function ($q) {
        mockModalService = {
          showModal: sinon.stub().returns($q.when({
            close: $q.when(modalCloseReturn)
          }))
        };
        return mockModalService;
      });
      locationStub = {
        path: sinon.stub()
      };
      $provide.value('$location', locationStub);
      $provide.factory('createIsolation', function ($q) {
        createIsolationStub = sinon.stub().returns($q.when({id: 'newIsolation'}));
        return createIsolationStub;
      });
      $provide.factory('demoFlowService', function () {
        demoFlowServiceStub = sinon.stub().returns($q.when({}));
        return demoFlowServiceStub;
      });
      $provide.factory('fetchInstancesByPod', function ($q) {
        fetchInstancesByPodStub = sinon.stub().returns($q.when(mockFetchInstancesByPodResults));
        return fetchInstancesByPodStub;
      });

    });
    angular.mock.inject(function (
      _$compile_,
      _$controller_,
      _$rootScope_,
      _$q_,
      _keypather_,
      _$timeout_
    ) {
      $compile = _$compile_;
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $q = _$q_;
      keypather = _keypather_;
      $timeout = _$timeout_;
    });




    sinon.spy($rootScope, '$on');
    sinon.spy($rootScope, '$broadcast');

    // Using bind-to-controller funtionality https://github.com/angular/angular.js/commit/d02d0585a086ecd2e1de628218b5a6d85c8fc7bd
    instanceNavigationController = $controller('InstanceNavigationController', {
      '$scope': $scope
    }, {
      instance: mockInstance
    });
    $rootScope.$digest();
  }

  beforeEach(function () {
    modalCloseReturn = true;
    mockInstance = {
      attrs: {
        name: 'mockInstanceName',
        shortHash: 'shortHash',
        owner: {
          username: 'Myztiq'
        }
      }
    };
    mockState = {
      params: {
        instanceName: '1234'
      }
    };
    mockFetchInstancesByPodResults = {
      models: [
        {
          id: 'nonRepo'
        },
        {
          id: 'repo'
        }
      ]
    };
  });

  describe('basics'.blue, function () {
    it('should exist', function () {
      setup();
      expect(instanceNavigationController, 'instanceNavigationController').to.be.ok;
      sinon.assert.calledOnce($rootScope.$on);
      sinon.assert.calledWith($rootScope.$on, '$stateChangeSuccess', sinon.match.func);
    });
    it('should fetch instances by pod and properly set the show setup modal state to true', function () {
      setup();
      sinon.assert.calledOnce(fetchInstancesByPodStub);
      expect(instanceNavigationController.shouldShowSetupModal).to.equal(true);
    });
    it('should fetch instances by pod and properly set the show setup modal state to false', function () {
      mockFetchInstancesByPodResults = {
        models: [
          {
            id: 'repo'
          }
        ]
      };
      setup();
      sinon.assert.calledOnce(fetchInstancesByPodStub);
      expect(instanceNavigationController.shouldShowSetupModal).to.equal(false);
    });
  });

  describe('with isolation', function () {
    beforeEach(function () {
      keypather.set(mockInstance, 'attrs.isIsolationGroupMaster', true);
      keypather.set(mockInstance, 'attrs.isolated', 'deadbeefdeadbeefdeadbeef');
      mockInstance.isolation = {
        instances: {
          models: [{
            id: 'isolatedChild'
          }],
          fetch: sinon.stub().returns([{id: 'isolatedChild1'}])
        }
      };
    });
    describe('as isolation group master', function () {
      it('should expand by default if it is selected', function () {
        setup()
        mockState.params.instanceName = mockInstance.attrs.name;
        $rootScope.$emit('$stateChangeSuccess')
        $scope.$digest();
        expect(instanceNavigationController.shouldExpand).to.equal(true);
      });
      it('should wait for isolation instances to be setup if the navigation matches', function () {
        mockState.params.instanceName = mockInstance.attrs.name;
        mockInstance.isolation = {};
        setup();
        expect(instanceNavigationController.shouldExpand).to.equal(false);
        $timeout.flush();
        mockInstance.isolation.instances = {models: [{id: 'isolatedChild'}]};
        $timeout.flush();
        expect(instanceNavigationController.shouldExpand).to.equal(true);
      });
      it('should fetch instances if the navigation matches and its isolated', function () {
        mockState.params.instanceName = mockInstance.attrs.name;
        mockInstance.isolation.instances.models = [];
        setup();
        sinon.assert.calledOnce(mockInstance.isolation.instances.fetch);
      });
      it('should fetch instances if the navigation matches a child and its isolated', function () {
        mockState.params.instanceName =  mockInstance.attrs.shortHash + '--fooBar';
        mockInstance.isolation.instances.models = [];
        setup();
        sinon.assert.calledOnce(mockInstance.isolation.instances.fetch);
      });
    });
    describe('as isolation group child', function () {
      beforeEach(function () {
        mockInstance.attrs.isIsolationGroupMaster = false;
      });
      it('should not expand if the url matches', function () {
        mockState.params.instanceName = mockInstance.attrs.name;
        setup();
        expect(instanceNavigationController.shouldExpand).to.equal(false);
        sinon.assert.notCalled(mockInstance.isolation.instances.fetch);
      });
      it('should should not expand if the url does not match', function () {
        mockState.params.instanceName = mockInstance.attrs.name + '1234';
        setup();
        expect(instanceNavigationController.shouldExpand).to.equal(false);
        sinon.assert.notCalled(mockInstance.isolation.instances.fetch);
      });
    });
  });
  describe('without isolation', function () {
    it('should expand if the url matches', function () {
      mockState.params.instanceName = mockInstance.attrs.name;
      setup();
      expect(instanceNavigationController.shouldExpand).to.equal(true);
    });
    it('should not expand if the url does not match', function () {
      mockState.params.instanceName = mockInstance.attrs.name + '1234';
      setup();
      expect(instanceNavigationController.shouldExpand).to.equal(false);
    });
  });

  describe('setupIsolation', function () {
    it('should launch the isolation configuration modal', function () {
      setup();
      instanceNavigationController.setupIsolation();
      $scope.$digest();
      sinon.assert.calledOnce($rootScope.$broadcast);
      sinon.assert.calledWith($rootScope.$broadcast, 'close-popovers');
      sinon.assert.calledOnce(mockModalService.showModal);
      sinon.assert.calledWith(mockModalService.showModal, {
        controller: 'IsolationConfigurationModalController',
        controllerAs: 'ICMC',
        templateUrl: 'isolationConfigurationModalView',
        inputs: {
          instance: mockInstance
        }
      });
    });
    it('should immediately create isolation if there are no non-repo containers', function () {
      setup();
      mockInstance.isolation = {
        instances: {
          fetch: sinon.stub().returns([{id: 'isolatedChild1'}])
        }
      };
      mockInstance.fetch = sinon.stub().returns({id: 'mockInstanceFetch'})
      instanceNavigationController.shouldShowSetupModal = false;
      instanceNavigationController.setupIsolation();
      $scope.$digest();
      sinon.assert.calledOnce($rootScope.$broadcast);
      sinon.assert.calledWith($rootScope.$broadcast, 'close-popovers');
      sinon.assert.calledOnce(createIsolationStub);
      sinon.assert.calledWith(createIsolationStub, mockInstance, []);
      sinon.assert.calledOnce(mockInstance.fetch);
      sinon.assert.calledOnce(mockInstance.isolation.instances.fetch);
      sinon.assert.calledOnce(locationStub.path);
      sinon.assert.calledWith(locationStub.path, '/' + mockInstance.attrs.owner.username + '/' + mockInstance.attrs.name);
    });
  });

  describe('disableIsolation', function () {
    beforeEach(function () {
      mockInstance.fetch = sinon.stub();
      mockInstance.isolation = {
        destroy: sinon.stub().returns(null)
      };
    });
    it('should launch the disable modal', function () {
      setup();
      instanceNavigationController.disableIsolation();
      $scope.$digest();
      sinon.assert.calledOnce($rootScope.$broadcast);
      sinon.assert.calledWith($rootScope.$broadcast, 'close-popovers');
      sinon.assert.calledOnce(mockModalService.showModal);
      sinon.assert.calledWith(mockModalService.showModal, {
        controller: 'ConfirmationModalController',
        controllerAs: 'CMC',
        templateUrl: 'disableIsolationConfirmationModal'
      });
    });
    it('should do nothing if the user cancels', function () {
      modalCloseReturn = false;
      setup();
      instanceNavigationController.disableIsolation();
      $scope.$digest();
      sinon.assert.notCalled(mockInstance.isolation.destroy);
    });
    it('should destroy the isolation and re-fetch the instance', function () {
      setup();
      instanceNavigationController.disableIsolation();
      $scope.$digest();
      sinon.assert.calledOnce(mockInstance.isolation.destroy);
      sinon.assert.calledOnce(mockInstance.fetch);
    });
  });
  describe('addContainerToIsolation', function () {
    it('should launch the setup template modal', function () {
      setup();
      instanceNavigationController.addContainerToIsolation();
      $scope.$digest();
      sinon.assert.calledOnce($rootScope.$broadcast);
      sinon.assert.calledWith($rootScope.$broadcast, 'close-popovers');
      sinon.assert.calledOnce(mockModalService.showModal);
      sinon.assert.calledWith(mockModalService.showModal, {
        controller: 'SetupTemplateModalController',
        controllerAs: 'STMC',
        templateUrl: 'setupTemplateModalView',
        inputs: {
          isolation: mockInstance.isolation
        }
      });
    });
  });
  describe('deleteContainer', function () {
    beforeEach(function () {
      mockInstance.destroy = sinon.stub();
    });
    it('should launch the delete modal', function () {
      setup();
      instanceNavigationController.deleteContainer();
      $scope.$digest();
      $scope.$digest();
      sinon.assert.calledOnce($rootScope.$broadcast);
      sinon.assert.calledWith($rootScope.$broadcast, 'close-popovers');
      sinon.assert.calledOnce(mockModalService.showModal);
      sinon.assert.calledWith(mockModalService.showModal, {
        controller: 'ConfirmationModalController',
        controllerAs: 'CMC',
        templateUrl: 'confirmDeleteServerView'
      });
    });
    it('should do nothing if the user cancels', function () {
      modalCloseReturn = false;
      setup();
      instanceNavigationController.deleteContainer();
      $scope.$digest();
      sinon.assert.notCalled(mockInstance.destroy);
    });
    it('should destroy the isolation and re-fetch the instance', function () {
      setup();
      instanceNavigationController.deleteContainer();
      $scope.$digest();
      sinon.assert.calledOnce(mockInstance.destroy);
    });
  });

  describe('editInstance', function () {
    var event;
    beforeEach(function () {
      event = {
        stopPropagation: sinon.stub(),
        preventDefault: sinon.stub()
      };
    });
    it('should launch the instance configuration modal', function () {
      mockInstance.contextVersion = {
        attrs: {
          advanced: true
        }
      };
      setup();
      instanceNavigationController.editInstance(event);
      $scope.$digest();
      sinon.assert.calledOnce(event.stopPropagation);
      sinon.assert.calledOnce(event.preventDefault);
      sinon.assert.calledOnce($rootScope.$broadcast);
      sinon.assert.calledWith($rootScope.$broadcast, 'close-popovers');
      sinon.assert.calledOnce(mockModalService.showModal);
      sinon.assert.calledWith(mockModalService.showModal, {
        controller: 'EditServerModalController',
        controllerAs: 'SMC',
        templateUrl: 'editServerModalView',
        inputs: {
          tab: 'env',
          instance: mockInstance,
          actions: {}
        }
      });
    });
    it('should launch the instance configuration modal for a non advanced instance', function () {
      mockInstance.contextVersion = {
        attrs: {
          advanced: false
        }
      };
      setup();
      instanceNavigationController.editInstance(event);
      $scope.$digest();
      sinon.assert.calledOnce(event.stopPropagation);
      sinon.assert.calledOnce(event.preventDefault);
      sinon.assert.calledOnce($rootScope.$broadcast);
      sinon.assert.calledWith($rootScope.$broadcast, 'close-popovers');
      sinon.assert.calledOnce(mockModalService.showModal);
      sinon.assert.calledWith(mockModalService.showModal, {
        controller: 'EditServerModalController',
        controllerAs: 'SMC',
        templateUrl: 'editServerModalView',
        inputs: {
          tab: 'repository',
          instance: mockInstance,
          actions: {}
        }
      });
    });
  });

});
