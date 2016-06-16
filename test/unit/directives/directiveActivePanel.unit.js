'use strict';

describe('directiveActivePanel'.bold.underline.blue, function() {
  var $elScope;
  var $rootScope;
  var $scope;
  var loadingStub;
  var instanceMock;
  var promisifyStub;
  var buildMock;
  var updateInstanceWithNewBuildStub;

  beforeEach(function () {
    buildMock = { id: 'build' };
    instanceMock = {
      containers: {
        models: [
          {
            attrs: {
              inspect: {
                Config: {
                  Cmd: [
                    'one',
                    'two',
                    'three'
                  ]
                }
              }
            }
          }
        ]
      },
      status: sinon.stub().returns('stopped'),
      attrs: {
        isTesting: true
      },
      build: {
        deepCopy: sinon.stub().returns(buildMock)
      }
    };
    loadingStub = sinon.stub();
    updateInstanceWithNewBuildStub = sinon.stub();
  });

  beforeEach(function () {
    angular.mock.module('app', function ($provide) {
      $provide.value('loading', loadingStub);
      $provide.factory('promisify', function ($q) {
        promisifyStub = sinon.spy(function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(obj, arguments));
          };
        });
        return promisifyStub;
      });
      $provide.value('updateInstanceWithNewBuild', updateInstanceWithNewBuildStub);
    });
    angular.mock.inject(function(
      $compile,
      _$rootScope_
    ) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $scope.build = {};
      $scope.instance = instanceMock;
      $scope.openItems = {};
      $scope.stateModel = {};
      $scope.validation = {};
      var tpl = directiveTemplate.attribute('active-panel', {
        build: 'build',
        instance: 'instance',
        openItems: 'openItems',
        stateModel: 'stateModel',
        validation: 'validation'
      });
      var element = $compile(tpl)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  });

  describe('getTestingStatus', function () {
    it('should return null if instance is not for testing', function () {
      instanceMock.attrs.isTesting = false;
      $scope.$digest();
      expect($elScope.getTestingStatus()).to.equal(null);
    });

    it('should return passed if instance is stopped', function () {
      instanceMock.status.returns('stopped');
      $scope.$digest();
      expect($elScope.getTestingStatus()).to.equal('passed');
    });

    it('should return failed if instance is crashed', function () {
      instanceMock.status.returns('crashed');
      $scope.$digest();
      expect($elScope.getTestingStatus()).to.equal('failed');
    });

    it('should return inProgress if instance is running', function () {
      instanceMock.status.returns('running');
      $scope.$digest();
      expect($elScope.getTestingStatus()).to.equal('inProgress');
    });

    it('should return null if instance is building', function () {
      instanceMock.status.returns('building');
      $scope.$digest();
      expect($elScope.getTestingStatus()).to.equal(null);
    });
  });

  describe('rebuildWithoutCache', function () {
    it('should allow the user to build without cache', function () {
      $elScope.rebuildWithoutCache();
      $scope.$digest();
      sinon.assert.calledWith(loadingStub, 'main', true);
      sinon.assert.calledOnce(instanceMock.build.deepCopy);
      sinon.assert.calledOnce(updateInstanceWithNewBuildStub);
      sinon.assert.calledWith(updateInstanceWithNewBuildStub, instanceMock, buildMock, true);
      sinon.assert.calledWith(loadingStub, 'main', false);
    });
  });

  describe('startCommand', function () {
    it('should return the start command', function () {
      expect($elScope.startCommand()).to.equal('three');
    });
  });

  describe('debug-cmd-status listener', function () {
    it('should set the debug command status when changed', function () {
      $elScope.$emit('debug-cmd-status', 'newStatus');
      $scope.$digest();
      expect($elScope.showDebugCmd).to.equal('newStatus');
    });
  });
});
