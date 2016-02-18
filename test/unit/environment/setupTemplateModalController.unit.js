/*global runnable:true */
'use strict';

var $controller;
var $rootScope;
var $scope;
var $compile;
var $q;

describe('SetupTemplateModalController'.bold.underline.blue, function () {
  var setupTemplateModalController;
  var fetchInstancesStub;
  var getNewForkNameStub;
  var createAndBuildNewContainerStub;
  var copySourceInstanceStub;
  var closeStub;
  var promisifyStub;

  var mockInstances;
  var mockIsolatedInstances;
  var mockIsolation;
  var mockNewForkName;
  var mockSourceInstance;
  var mockBuildContainer;

  var sourceInstance;
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
      $provide.factory('fetchInstances', function ($q) {
        fetchInstancesStub = sinon.stub().returns($q.when(mockInstances));
        return fetchInstancesStub;
      });
      $provide.factory('isolation', function () {
        return mockIsolation;
      });
      getNewForkNameStub = sinon.stub().returns(mockNewForkName);
      $provide.value('getNewForkName', getNewForkNameStub);

      $provide.factory('createAndBuildNewContainer', function ($q) {
        createAndBuildNewContainerStub = sinon.stub().returns($q.when(mockBuildContainer));
        return createAndBuildNewContainerStub;
      });
      $provide.factory('copySourceInstance', function ($q) {
        copySourceInstanceStub = sinon.stub().returns($q.when(mockSourceInstance));
        return copySourceInstanceStub;
      });
      closeStub = sinon.stub();
      $provide.value('close', closeStub);
    });
    angular.mock.inject(function (
      _$compile_,
      _$controller_,
      _$rootScope_,
      _$q_
    ) {
      $compile = _$compile_;
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $q = _$q_;
    });

    $rootScope.dataApp = {
      data: {
        activeAccount: 'activeAccount'
      }
    };

    setupTemplateModalController = $controller('SetupTemplateModalController', {
      '$scope': $scope
    });
    $rootScope.$digest();
  }

  beforeEach(function () {
    sourceInstance = {
      attrs: {
        name: 'sourceInstance'
      }
    };
    mockInstances = [
      {
        id: 'mockInstance1'
      },
      {
        id: 'mockInstance2'
      }
    ];
    mockIsolatedInstances = [
      {
        id: 'isolatedInstance1'
      }
    ];
    mockIsolation = {
      instances: {
        id: 'islatedInstances',
        fetch: sinon.stub().returns(mockIsolatedInstances)
      },
      groupMaster: {
        attrs: {
          shortHash: 'masterInstanceShortHash'
        }
      }
    };
    mockNewForkName = 'mockForkName';
    mockSourceInstance = {
      id: 'mockBuild'
    };
    mockBuildContainer = {
      id: 'mockBuildContainer'
    };
  });
  describe('basics'.blue, function () {
    beforeEach(setup);
    it('should exist', function () {
      expect(setupTemplateModalController, 'setupTemplateModalController').to.be.ok;
    });
  });

  describe('initial setup', function () {
    beforeEach(setup);
    it('should fetch hello runnable instances', function () {
      expect(setupTemplateModalController.templateServers).to.equal(mockInstances);
      sinon.assert.calledOnce(fetchInstancesStub);
      sinon.assert.calledWith(fetchInstancesStub, { githubUsername: 'HelloRunnable' });
    });
  });

  describe('addServerFromTemplate', function () {
    describe('with isolation', function () {
      beforeEach(setup);
      it('should create a new instance with isolation', function () {
        setupTemplateModalController.addServerFromTemplate(sourceInstance);
        $rootScope.$digest();

        sinon.assert.calledOnce(mockIsolation.instances.fetch);
        sinon.assert.calledOnce(getNewForkNameStub);
        var newServerName = mockIsolation.groupMaster.attrs.shortHash + '--' + sourceInstance.attrs.name;
        sinon.assert.calledWith(getNewForkNameStub,
          newServerName,
          mockIsolatedInstances,
          true);
        sinon.assert.calledOnce(createAndBuildNewContainerStub);
        sinon.assert.calledWith(createAndBuildNewContainerStub,
          sinon.match.object,
          mockNewForkName,
          { isolation: mockIsolation });
        createAndBuildNewContainerStub.lastCall.args[0].then(function (actualResponse) {
          expect(actualResponse).to.deep.equal({
            opts: {
              name: mockNewForkName,
              masterPod: true,
              ipWhitelist: {
                enabled: true
              }
            },
            build: mockSourceInstance
          });
        });
        $rootScope.$digest();
        sinon.assert.calledOnce(copySourceInstanceStub);
        sinon.assert.calledWith(copySourceInstanceStub,
          $rootScope.dataApp.data.activeAccount,
          sourceInstance,
          mockNewForkName);
      });
    });
    describe('without isolation', function () {
      beforeEach(function () {
        mockIsolation = null;
        setup();
      });
      it('should create a new instance', function () {
        setupTemplateModalController.addServerFromTemplate(sourceInstance);
        $rootScope.$digest();
        sinon.assert.calledTwice(fetchInstancesStub);
        expect(fetchInstancesStub.lastCall.args.length, 'fetchInstances last call argument length').to.equal(0);
      });
    });
  });


});
