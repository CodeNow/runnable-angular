/*global runnable:true, directiveTemplate:true  */
'use strict';

describe('serverCardDirective'.bold.underline.blue, function () {
  var ctx;
  var $timeout;
  var $scope;
  var $compile;
  var $elScope;
  var $rootScope;
  var keypather;
  var parseDockMock = new (require('../fixtures/mockFetch'))();
  var fetchStackAnalysisMock;
  var mockState;

  var apiMocks = require('../apiMocks/index');
  function setup(scope, stackAnalysisData) {
    stackAnalysisData = stackAnalysisData || {};

    fetchStackAnalysisMock = sinon.stub();

    ctx = {};
    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      }
    };
    mockState = {
      params: {
        userName: 'SomeKittens'
      }
    };

    runnable.reset(apiMocks.user);
    angular.mock.module('app', function ($provide) {
      $provide.factory('parseDockerfileForCardInfoFromInstance', parseDockMock.fetch());
      $provide.value('$state', mockState);
      $provide.factory('fetchStackAnalysis', function ($q) {
        return fetchStackAnalysisMock.returns($q.when(stackAnalysisData));
      });
    });
    angular.mock.inject(function (
      _$compile_,
      _$timeout_,
      _$rootScope_,
      _keypather_
    ) {
      $timeout = _$timeout_;
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
    });

    $rootScope.featureFlags = {};

    keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeOrg1);
    Object.keys(scope).forEach(function (key) {
      $scope[key] = scope[key];
    });

    ctx.template = directiveTemplate.attribute('server-card', {
      'data': 'data',
      'actions': 'actions',
      'instance': 'instance'
    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
    $scope.$digest();
  }
  describe('basic', function () {
    it('Check the scope', function () {

      var instance = runnable.newInstance(
        apiMocks.instances.running,
        {noStore: true}
      );
      var scope = {
        data: {
          stacks: apiMocks.stackInfo,
          instances: []
        },
        actions: {
          iunno: angular.noop
        },
        instance: instance
      };
      setup(scope);
      expect($elScope.data).to.equal(scope.data);
      expect($elScope.actions).to.equal(scope.actions);
      expect($elScope.instance).to.equal(scope.instance);

      expect($elScope.server).to.be.ok;
      expect($elScope.activeAccount).to.be.ok;
      expect($elScope.getFlattenedSelectedStacks).to.be.function;

    });

    it('should flatten the dependency stack', function () {

      var instance = runnable.newInstance(
        apiMocks.instances.running,
        {noStore: true}
      );
      var scope = {
        data: {
          stacks: apiMocks.stackInfo,
          instances: []
        },
        actions: {
          iunno: angular.noop
        },
        instance: instance
      };
      setup(scope);

      var railsInfo = angular.copy(apiMocks.stackInfo[0]);
      railsInfo.selectedVersion = '0.1';
      railsInfo.dependencies[0].selectedVersion = '0.2';

      var result = $elScope.getFlattenedSelectedStacks(railsInfo);

      expect(result).to.equal('Rails 0.1, Ruby 0.2');

    });

    it('server object creation, fake instance at start', function() {
      var instanceName = 'instanceName';
      var instance = runnable.newInstance(
        apiMocks.instances.running,
        {noStore: true}
      );

      instance.attrs.env = ['hello=asdfasd', 'aasdasd=asdasd'];
      var scope = {
        data: {
          stacks: apiMocks.stackInfo,
          instances: []
        },
        actions: {
          iunno: angular.noop
        },
        instance: {
          getMasterPodName: sinon.stub().returns(instanceName),
          attrs: {
            name: 'headsfadsf'
          }
        }
      };
      setup(scope);
      $scope.$digest();
      $rootScope.$apply();

      expect($elScope.server, 'server').to.be.ok;
      expect($elScope.server.instance, 'instance').to.deep.equal(scope.instance);
      expect($elScope.server.build, 'build').to.not.be.ok;

      expect($elScope.server.opts.env, 'env').to.not.be.ok;
      expect($elScope.server.building, 'building').to.be.undefined;
      instance.build = runnable.newBuild(
        apiMocks.builds.built,
        {noStore: true}
      );
      instance.fetchDependencies = function (cb) {
        $timeout(function () {
          cb(null, {models: [apiMocks.instances.running, apiMocks.instances.stopped]});
        });
        return {models: [apiMocks.instances.running, apiMocks.instances.stopped]};
      };

      instance.contextVersion = {
        attrs: {
          advanced: false,
          infraCodeVersion: 'asdasd'
        },
        appCodeVersions: {
          models: [{
            githubRepo: {
              attrs: {
                name: 'HELLO'
              },
              branches: {
                fetch: sinon.spy(function (cb) {
                  cb();
                  return;
                })
              }
            }
          }]
        }
      };
      $scope.instance = instance;

      $scope.$digest();
      expect($elScope.server.instance, 'instance').to.equal(instance);
      $scope.$digest();
      parseDockMock.triggerPromise({
        selectedStack: 'CHEESE',
        ports: 'kajflkajsf',
        startCommand: 'star command'
      });
      $scope.$digest();
      $timeout.flush();
      expect($elScope.server.opts.env, 'env').to.equal(instance.attrs.env);
      expect($elScope.server.selectedStack, 'selectedStack').to.equal('CHEESE');
      expect($elScope.server.ports, 'ports').to.equal('kajflkajsf');
      expect($elScope.server.startCommand, 'startCommand').to.equal('star command');
      expect($elScope.showSpinner(), 'showSpinner').to.not.be.ok;
    });



    it('server object creation, real instance at start', function() {
      var instance = runnable.newInstance(
        apiMocks.instances.running,
        {noStore: true}
      );

      instance.attrs.env = ['hello=asdfasd', 'aasdasd=asdasd'];
      var scope = {
        data: {
          stacks: apiMocks.stackInfo,
          instances: []
        },
        actions: {
          iunno: angular.noop
        },
        instance: instance
      };

      instance.build = runnable.newBuild(
        apiMocks.builds.built,
        {noStore: true}
      );

      instance.fetchDependencies = sinon.spy(function (cb) {
        cb();
        return [];
      });
      instance.contextVersion = {
        attrs: {
          advanced: false,
          infraCodeVersion: 'asdasd'
        },
        appCodeVersions: {
          models: [{
            githubRepo: {
              attrs: {
                name: 'HELLO'
              },
              branches: {
                fetch: sinon.spy(function (cb) {
                  cb();
                  return;
                })
              }
            }
          }]
        }
      };
      setup(scope);
      $scope.$digest();
      expect($elScope.showSpinner(), 'showSpinner').to.be.ok;

      $scope.$digest();
      parseDockMock.triggerPromise(null);
      $scope.$digest();
      expect($elScope.server.opts.env, 'env').to.equal(instance.attrs.env);

      expect($elScope.server.selectedStack, 'selectedStack').to.not.be.ok;
      expect($elScope.server.ports, 'ports').to.not.be.ok;
      expect($elScope.server.startCommand, 'startCommand').to.not.be.ok;
      expect($elScope.showSpinner(), 'showSpinner').to.not.be.ok;
    });
  });
});
