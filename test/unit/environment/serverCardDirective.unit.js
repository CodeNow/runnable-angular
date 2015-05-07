'use strict';

describe('serverCardDirective'.bold.underline.blue, function () {
  var ctx;

  var $scope,
      $compile,
      $elScope,
      $rootScope,
      $q,
      $timeout;
  var keypather;
  var parseDockMock = new (require('../fixtures/mockFetch'))();

  var apiMocks = require('../apiMocks/index');
  var thisUser = runnable.newUser(apiMocks.user);
  function setup(scope) {

    ctx = {};
    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      }
    };
    runnable.reset(apiMocks.user);
    angular.mock.module('app', function ($provide) {
      $provide.factory('parseDockerfileForCardInfoFromInstance', parseDockMock.fetch());
    });
    angular.mock.inject(function (
      _$compile_,
      _$rootScope_,
      _keypather_,
      _$timeout_,
      _$q_
    ) {
      $compile = _$compile_;
      $q = _$q_;
      $timeout = _$timeout_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
    });


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
          stacks: apiMocks.stackInfo
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
      expect($elScope.getInstanceClasses).to.be.ok;
      expect($elScope.getFlattenedSelectedStacks).to.be.function;

    });

    it('should flatten the dependency stack', function () {

      var instance = runnable.newInstance(
        apiMocks.instances.running,
        {noStore: true}
      );
      var scope = {
        data: {
          stacks: apiMocks.stackInfo
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

      expect(result).to.equal('Rails v0.1, Ruby v0.2');

    });

    it('server object creation, fake instance at start', function() {
      var instance = runnable.newInstance(
        apiMocks.instances.running,
        {noStore: true}
      );

      instance.attrs.env = ['hello=asdfasd', 'aasdasd=asdasd'];
      var scope = {
        data: {
          stacks: apiMocks.stackInfo
        },
        actions: {
          iunno: angular.noop
        },
        instance: {
          attrs: {
            name: 'headsfadsf'
          }
        }
      };
      setup(scope);
      $scope.$digest();

      expect($elScope.server, 'server').to.be.ok;
      expect($elScope.server.instance, 'instance').to.deep.equal({
        attrs: {
          name: 'headsfadsf'
        }
      });
      expect($elScope.server.build, 'build').to.not.be.ok;

      expect($elScope.server.opts.env, 'env').to.not.be.ok;
      expect($elScope.server.building, 'building').to.not.be.ok;
      instance.build = runnable.newBuild(
        apiMocks.builds.built,
        {noStore: true}
      );
      var depInstances = runnable.newInstances(
        [apiMocks.instances.running, apiMocks.instances.stopped],
        {noStore: true}
      );
      sinon.stub(instance, 'fetchDependencies', function (cb) {
        expect($elScope.showSpinner(), 'showSpinner').to.be.ok;
        cb(null, depInstances);
        return depInstances;
      });
      $scope.instance = instance;
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

      $scope.$digest();
      parseDockMock.triggerPromise({
        selectedStack: 'CHEESE',
        ports: 'kajflkajsf',
        startCommand: 'star command'
      });
      $scope.$digest();
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
          stacks: apiMocks.stackInfo
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

      sinon.stub(instance, 'fetchDependencies', function (cb) {
        cb();
        return;
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