'use strict';

var $rootScope,
  $scope;
var element;
var $compile;
var $q;
var $elScope;
var CSBC;
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
        },
        attrs: {
          isTesting: false
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
      expect($elScope.getStatusText()).to.equal('Unknown');

      Object.keys(statusMap).forEach(function (status) {
        mockInstance.status.reset();
        mockInstance.status = sinon.stub().returns(status);
        $elScope.$digest();
        expect($elScope.getStatusText(), 'status ' + status).to.equal(statusMap[status]);
      });

      // Check neverStarted with the feature flag on
      mockInstance.status.reset();
      mockInstance.status = sinon.stub().returns('neverStarted');
      $rootScope.featureFlags.internalDebugging = true;

      $elScope.$digest();
      expect($elScope.getStatusText()).to.equal('Never Started');
    });

    it('should update the button text correctly when testing', function () {
      mockInstance.attrs.isTesting = true;
      var testingStatusMap = {
        building: 'Building',
        stopped: 'Tests Passed',
        crashed: 'Tests Failed',
        running: 'Tests Running'
      };
      mockInstance.status = sinon.stub().returns('adsfasdfads');
      $elScope.$digest();
      expect($elScope.getStatusText()).to.equal('Unknown');

      Object.keys(testingStatusMap).forEach(function (status) {
        mockInstance.status.reset();
        mockInstance.status = sinon.stub().returns(status);
        $elScope.$digest();
        expect($elScope.getStatusText(), 'status ' + status).to.equal(testingStatusMap[status]);
      });

      // Check neverStarted with the feature flag on
      mockInstance.status.reset();
      mockInstance.status = sinon.stub().returns('neverStarted');
      $rootScope.featureFlags.internalDebugging = true;

      $elScope.$digest();
      expect($elScope.getStatusText(), 'neverStarted').to.equal('Never Started');
    });
  });

  describe('getClassForInstance', function () {
    var classesMap = {
      starting: ['gray'],
      stopping: ['gray'],
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
        expect($elScope.getClassForInstance(), 'status ' + status).to.deep.equal(classesMap[status]);
      });
    });
  });
});
