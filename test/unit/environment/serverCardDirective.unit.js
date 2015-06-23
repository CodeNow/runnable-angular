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
      $provide.factory('helpCards', helpCardsMock.create(ctx));
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
          stacks: apiMocks.stackInfo,
          instances: []
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

  describe('help cards', function () {
    describe('Non repo instance', function () {
      it('should find a help card a missing dependency to a non repo container', function () {
        var instance = runnable.newInstance(
          apiMocks.instances.running,
          {noStore: true}
        );
        instance.attrs.env = ['hello=asdfasd', 'aasdasd=asdasd'];

        instance.fetchDependencies = sinon.spy(function (cb) {
          $timeout(cb);
          return [];
        });

        var scope = {
          data: {
            stacks: apiMocks.stackInfo,
            instances: [
              instance,
              {
                contextVersion: {
                  getMainAppCodeVersion: sinon.stub().returns({})
                },
                fetchDependencies: sinon.spy(function (cb) {
                  $timeout(cb);
                  return [];
                })
              }
            ]
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
        instance.contextVersion = {
          getMainAppCodeVersion: sinon.stub().returns({}),
          attrs: {
            advanced: false,
            infraCodeVersion: 'asdasd'
          },
          appCodeVersions: {
            models: []
          }
        };
        setup(scope);
        parseDockMock.triggerPromise(null);
        $scope.$digest();
        $timeout.flush();

        sinon.assert.calledOnce(ctx.helpCards.triggerCard);
        sinon.assert.calledWith(ctx.helpCards.triggerCard, 'missingMapping', {
          mapping: instance.attrs.name
        });
      });
      it('should not trigger if there is a dependency that matches', function () {
        var instance = runnable.newInstance(
          apiMocks.instances.running,
          {noStore: true}
        );

        instance.attrs.env = ['hello=asdfasd', 'aasdasd=asdasd'];

        instance.fetchDependencies = sinon.spy(function (cb) {
          $timeout(cb);
          return [];
        });

        var dependencies = {
          models: [
            {
              attrs: {
                name: instance.attrs.name
              }
            }
          ]
        };

        dependencies.filter = function (fn) {
          return dependencies.models.filter(fn);
        };
        dependencies.map = function (fn) {
          return dependencies.models.map(fn);
        };
        dependencies.find = function (fn) {
          return dependencies.models.find(fn);
        };


        var scope = {
          data: {
            stacks: apiMocks.stackInfo,
            instances: [
              instance,
              {
                dependencies: dependencies
              }
            ]
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
        instance.contextVersion = {
          attrs: {
            advanced: false,
            infraCodeVersion: 'asdasd'
          },
          appCodeVersions: {
            models: []
          }
        };
        setup(scope);
        parseDockMock.triggerPromise(null);
        $scope.$digest();
        $timeout.flush();

        sinon.assert.notCalled(ctx.helpCards.triggerCard);
      });
    });

    describe('repo backed instance', function () {
      it('should not find any help cards if there are no service dependencies in the stackAnalysis', function () {
        var instance = runnable.newInstance(
          apiMocks.instances.running,
          {noStore: true}
        );

        instance.contextVersion = {
          getMainAppCodeVersion: sinon.stub().returns({})
        };

        instance.attrs.env = ['hello=asdfasd', 'aasdasd=asdasd'];

        instance.fetchDependencies = sinon.spy(function (cb) {
          $timeout(cb);
          return [];
        });

        var scope = {
          data: {
            stacks: apiMocks.stackInfo,
            instances: [
              instance,
              {
                fetchDependencies: sinon.spy(function (cb) {
                  $timeout(cb);
                  return [];
                })
              }
            ]
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
        instance.contextVersion = {
          attrs: {
            advanced: false,
            infraCodeVersion: 'asdasd'
          },
          appCodeVersions: {
            models: []
          },
          getMainAppCodeVersion: function () {
            return {
              attrs: {
                repo: 'fullRepoName'
              }
            };
          }
        };

        var analysisMockData = {
          languageFramework: 'ruby_ror',
          version: {
            rails: '4.1.8',
            ruby: '0.8'
          }
        };
        setup(scope, analysisMockData);
        parseDockMock.triggerPromise(null);

        $scope.$digest();
        $timeout.flush();

        sinon.assert.notCalled(ctx.helpCards.triggerCard);
      });

      it('should not find a missingAssociation and a missingDependency', function () {
        var instance = runnable.newInstance(
          apiMocks.instances.running,
          {noStore: true}
        );

        instance.attrs.env = ['hello=asdfasd', 'aasdasd=asdasd'];

        instance.fetchDependencies = sinon.spy(function (cb) {
          $timeout(cb);
          return [{
            attrs: {
              shortHash: 'shortHash1'
            }
          }];
        });
        var scope = {
          data: {
            stacks: apiMocks.stackInfo,
            instances: [
              instance,
              {
                attrs: {
                  lowerName: 'mongo',
                  name: 'Mongo'
                }
              },
              {
                attrs: {
                  shortHash: 'shortHash1',
                  lowerName: 'foo'
                }
              }
            ]
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
        instance.contextVersion = {
          attrs: {
            advanced: false,
            infraCodeVersion: 'asdasd'
          },
          appCodeVersions: {
            models: []
          },
          getMainAppCodeVersion: function () {
            return {
              attrs: {
                repo: 'fullRepoName'
              }
            };
          }
        };

        var analysisMockData = {
          languageFramework: 'ruby_ror',
          version: {
            rails: '4.1.8',
            ruby: '0.8'
          },
          serviceDependencies: [
            'mongo',
            'mysql',
            'foo'
          ]
        };

        setup(scope, analysisMockData);
        parseDockMock.triggerPromise(null);

        $scope.$digest();
        $timeout.flush();

        sinon.assert.called(ctx.helpCards.triggerCard);

        sinon.assert.calledWith(ctx.helpCards.triggerCard, 'missingAssociation', {
          association: 'Mongo',
          instance: instance
        });

        sinon.assert.calledWith(ctx.helpCards.triggerCard, 'missingDependency', {
          dependency: 'mysql',
          instance: instance
        });
      });
    });
  });
});