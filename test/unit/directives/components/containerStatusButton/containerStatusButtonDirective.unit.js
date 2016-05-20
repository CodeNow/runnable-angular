'use strict';

var $rootScope,
  $scope;
var element;
var $compile;
var keypather;
var $q;
var $elScope;
var CSBC;
var readOnlySwitchController;
var apiMocks = require('./../../../apiMocks/index');

describe('containerStatusButtonDirective'.bold.underline.blue, function () {
  var ctx;
  var mockInstance;
  var promisifyMock;
  var mockMainACV;


  beforeEach(function () {
    ctx = {};
  });

  beforeEach(function () {
    ctx.errsMock = {
      handler: sinon.spy()
    };
    var ContainerStatusButtonController = function () {
      CSBC = this;
    };

    ctx.loadingMock = sinon.spy();
    angular.mock.module('app', function ($provide, $controllerProvider) {
      $controllerProvider.register('ContainerStatusButtonController', ContainerStatusButtonController);
      $provide.value('errs', ctx.errsMock);
      $provide.factory('promisify', function ($q) {
        promisifyMock = sinon.spy(function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(obj, arguments));
          };
        });
        return promisifyMock;
      });
    });
    angular.mock.inject(function (_$compile_, _$timeout_, _$rootScope_, _$q_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      $scope = $rootScope.$new();
      $q = _$q_;

      mockMainACV = {
        attrs: {
          mainACVAttrs: true
        }
      };
      mockInstance = {
        restart: sinon.spy(),
        fetch: sinon.spy(),
        status: sinon.stub().returns('running'),
        stop: sinon.spy(),
        start: sinon.spy(),
        build: {
          deepCopy: sinon.spy()
        },
        contextVersion: {
          getMainAppCodeVersion: sinon.stub().returns(mockMainACV)
        }
      };
      $rootScope.featureFlags = {
        internalDebugging: false
      };

      var template = directiveTemplate.attribute('container-status-button', {
        instance: 'instance'
      });
      $scope.instance = mockInstance;
      element = $compile(template)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  });
  describe('StatusText', function () {
    it('update the button text correctly', function () {
      var statusMap = {
        starting: 'Starting',
        stopping: 'Stopping',
        building: 'Building',
        stopped: 'Stopped',
        crashed: 'Crashed',
        running: 'Running',
        buildFailed: 'Build Failed',
        neverStarted: 'Build Failed',
        unknown: 'Unknown'
      };
      mockInstance.status = sinon.stub().returns('adsfasdfads');
      $elScope.$digest();
      expect('Unknown').to.equal($elScope.getStatusText());

      Object.keys(statusMap).forEach(function (status) {
        mockInstance.status.reset();
        mockInstance.status = sinon.stub().returns(status);
        $elScope.$digest();
        expect(statusMap[status], 'status ' + status).to.equal($elScope.getStatusText());
      });

      // Check neverStarted with the feature flag on
      mockInstance.status.reset();
      mockInstance.status = sinon.stub().returns('neverStarted');
      $rootScope.featureFlags.internalDebugging = true;

      $elScope.$digest();
      expect('Never Started', 'neverStarted').to.equal($elScope.getStatusText());
    });
  });

  describe('getClassForInstance', function () {
    var classesMap = {
      starting: ['gray', 'in'],
      stopping: ['gray', 'in'],
      building: ['gray'],
      stopped: ['gray'],
      crashed: ['red'],
      running: ['gray'],
      buildFailed: ['red'],
      neverStarted: ['red'],
      unknown: ['gray']
    };
    it('update the button text correctly', function () {
      mockInstance.status = sinon.stub();

      Object.keys(classesMap).forEach(function (status) {
        mockInstance.status.reset();
        mockInstance.status = sinon.stub().returns(status);
        $elScope.$digest();
        expect(classesMap[status], 'status ' + status).to.deep.equal($elScope.getClassForInstance());
      });

    });
  });

  describe('configStatusValid', function () {
    it('should fetch the parent status everytime the configStatusValid changes', function () {
      mockInstance.fetchParentConfigStatus = sinon.stub().returns(false);
      mockInstance.configStatusValid = false;
      $elScope.$digest();

      sinon.assert.calledOnce(mockInstance.fetchParentConfigStatus);
      mockInstance.fetchParentConfigStatus.reset();
      mockInstance.configStatusValid = true;
      $elScope.$digest();

      sinon.assert.notCalled(mockInstance.fetchParentConfigStatus);
    });
  });

  it('should show the instance as busy if its starting', function () {
    $scope.instance.status = sinon.stub().returns('starting');
    expect($elScope.isChanging()).to.be.true;
    sinon.assert.calledOnce($scope.instance.status);
  });

  it('should show the instance as busy if its starting', function () {
    $scope.instance.status = sinon.stub().returns('starting');
    expect($elScope.isChanging()).to.be.true;
    sinon.assert.calledOnce($scope.instance.status);
  });

  it('should show the instance as busy if its stopping', function () {
    $scope.instance.status = sinon.stub().returns('stopping');
    expect($elScope.isChanging()).to.be.true;
    sinon.assert.calledOnce($scope.instance.status);
  });

  it('should show the instance as busy if its building', function () {
    $scope.instance.status = sinon.stub().returns('building');
    expect($elScope.isChanging()).to.be.false;
    sinon.assert.calledOnce($scope.instance.status);
  });

  it('should show the instance as not busy if its Started', function () {
    $scope.instance.status = sinon.stub().returns('started');
    expect($elScope.isChanging()).to.be.false;
    sinon.assert.calledOnce($scope.instance.status);
  });
});
