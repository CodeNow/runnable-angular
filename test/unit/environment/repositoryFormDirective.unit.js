'use strict';

describe('repositoryFormDirective'.bold.underline.blue, function () {
  var ctx;
  var $timeout;
  var $scope;
  var $compile;
  var $elScope;
  var $rootScope;
  var loadingPromises;
  var keypather;
  var cardInfoTypes;

  var apiMocks = require('../apiMocks/index');
  var MockFetch = require('../fixtures/mockFetch');
  var parseDockerfileForDefaultsStub;
  function setup(scope, updateError) {
    ctx = {};
    ctx.fetchDockerfileFromSourceMock = new MockFetch();
    ctx.errsMock = {
      handler: sinon.spy()
    };
    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      }
    };
    ctx.acv = {
      attrs: angular.copy(apiMocks.appCodeVersions.bitcoinAppCodeVersion),
      update: sinon.spy(function (opts, cb) {
        if (updateError) {
          cb(updateError);
          return updateError;
        }
        return cb();
      }),
      resetState: sinon.spy(),
      setState: sinon.spy()
    };
    ctx.repo1 = {
      attrs: angular.copy(apiMocks.gh.repos[0]),
      fakeBranch: {
        attrs: {
          name: null
        },
        fetch: sinon.spy(function (cb) {
          $rootScope.$evalAsync(function () {
            cb(null, ctx.repo1.fakeBranch);
          });
          return ctx.repo1.fakeBranch;
        })
      },
      newBranch: sinon.spy(function (opts) {
        ctx.repo1.fakeBranch.attrs.name = opts;
        return ctx.repo1.fakeBranch;
      }),
      branches: {
        add: sinon.spy(),
        fetch: sinon.spy(function (cb) {
          ctx.repo1.branches.models = apiMocks.branches.bitcoinRepoBranches.map(function (branch) {
            return {
              attrs: branch
            };
          });
          $rootScope.$evalAsync(function () {
            if (cb) { cb(null, ctx.repo1.branches); }
          });
          return ctx.repo1.branches;
        }),
        models: []
      }
    };
    runnable.reset(apiMocks.user);
    angular.mock.module('app', function ($provide) {
      $provide.value('errs', ctx.errsMock);
      $provide.factory('fetchRepoBranches', function ($q) {
        return function (repo) {
          return $q(function (resolve) {
            repo.branches.fetch(resolve);
          });
        };
      });

      ctx.updateDockerfileFromStateMock = sinon.spy();
      $provide.factory('updateDockerfileFromState', function () {
        return ctx.updateDockerfileFromStateMock;
      });
      $provide.factory('fetchDockerfileFromSource', ctx.fetchDockerfileFromSourceMock.fetch());
      $provide.factory('parseDockerfileForDefaults', function () {
        parseDockerfileForDefaultsStub = sinon.spy(function () {
          return ctx.parseDockerfileResults;
        });
        return parseDockerfileForDefaultsStub;
      });
    });
    angular.mock.inject(function (
      _$compile_,
      _$timeout_,
      _$rootScope_,
      _loadingPromises_,
      _keypather_,
      _cardInfoTypes_
    ) {
      $timeout = _$timeout_;
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
      loadingPromises = _loadingPromises_;
      cardInfoTypes = _cardInfoTypes_;
    });


    keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeOrg1);
    Object.keys(scope).forEach(function (key) {
      $scope[key] = scope[key];
    });
    $scope.state.commands = $scope.state.commands || [];

    ctx.template = directiveTemplate.attribute('repository-form', {
      'state': 'state',
      'start-command-can-disable': 'startCommandCanDisable',
      'loading-promises-target': 'loadingPromisesTarget',
      'ng-show': 'true'
    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }
  describe('basic', function () {
    it('Check the scope', function () {
      var scope = {
        data: {
          stacks: apiMocks.stackInfo
        },
        state: {
          cheese: {
            hello: 'jello'
          }
        },
        startCommandCanDisable: true
      };
      setup(scope);
      expect($elScope.data).to.deep.equal({
        cacheCommand: false
      });
      expect($elScope.state).to.equal(scope.state);
      expect($elScope.startCommandCanDisable).to.be.true;
      $rootScope.$destroy();
    });

    it('should disable cache when toggleCache to off', function () {
      var scope = {
        data: {
          stacks: apiMocks.stackInfo
        },
        state: {
          cheese: {
            hello: 'jello'
          },
          containerFiles: [
            {
              type: 'Main Repository',
              commands: [{
                cache: true,
                body: 'npm install'
              }]
            }
          ]
        },
        startCommandCanDisable: true
      };
      setup(scope);

      expect($elScope.data.cacheCommand, 'Cache enabled').to.be.ok;
      // This is a checkbox so both of these things will happen at the same time!
      $elScope.data.cacheCommand = false;
      $elScope.actions.toggleCache();
      $scope.$digest();

      expect($elScope.state.containerFiles[0].commands[0].cache, 'Cached command').to.not.be.ok;

    });
    it('should enable cache when toggleCache to true', function () {
      var scope = {
        data: {
          stacks: apiMocks.stackInfo
        },
        state: {
          cheese: {
            hello: 'jello'
          },
          containerFiles: [
            {
              type: 'Main Repository',
              commands: [{
                cache: false,
                body: 'npm install'
              }]
            }
          ]
        },
        startCommandCanDisable: true
      };
      setup(scope);

      expect($elScope.data.cacheCommand, 'Cache enabled').to.not.be.ok;
      // This is a checkbox so both of these things will happen at the same time!
      $elScope.data.cacheCommand = true;
      $elScope.actions.toggleCache();
      $scope.$digest();

      expect($elScope.state.containerFiles[0].commands[0].cache, 'Cached command').to.be.ok;

    });

    it('should enable cache for the first non empty command when toggleCache is set to true', function () {
      var scope = {
        data: {
          stacks: apiMocks.stackInfo
        },
        state: {
          cheese: {
            hello: 'jello'
          },
          containerFiles: [
            {
              type: 'Main Repository',
              commands: [
                {
                  cache: false,
                  body: ''
                },
                {
                  cache: false,
                  body: 'npm install'
                }
              ]
            }
          ]
        },
        startCommandCanDisable: true
      };
      setup(scope);

      expect($elScope.data.cacheCommand, 'Cache enabled').to.not.be.ok;
      // This is a checkbox so both of these things will happen at the same time!
      $elScope.data.cacheCommand = true;
      $elScope.actions.toggleCache();
      $scope.$digest();

      expect($elScope.state.containerFiles[0].commands[0].cache, 'Cached command').to.not.be.ok;
      expect($elScope.state.containerFiles[0].commands[1].cache, 'Cached command').to.be.ok;

    });
  });

  describe('selected stack changes', function () {
    beforeEach(function () {
      var scope = {
        data: {
          stacks: apiMocks.stackInfo
        },
        state: {
          cheese: {
            hello: 'jello'
          },
          startCommand: 'asdfgkasdlfk;js',
          containerFiles: [
            {
              type: 'Main Repository',
              commands: [{
                cache: true,
                body: 'npm install'
              }]
            },
            {
              type: 'Repository',
              commands: [{
                cache: false,
                body: 'npm install'
              }]
            }
          ]
        },
        startCommandCanDisable: true
      };
      setup(scope);

    });
    it('should fetch default commands when stack is modified', function () {
      ctx.parseDockerfileResults = {
        run: ['1234'],
        dst: ['/dfasgdfsgdsfgs/fgdsfgsdfg']
      };
      $elScope.state.selectedStack = {
        key: 'hello'
      };
      $scope.$digest();
      var dockerfile = {attrs: 'dockerfile'};

      expect($elScope.state.startCommand, 'startCommand').to.not.equal('asdfgkasdlfk;js');
      expect($elScope.state.containerFiles[0].commands, 'main repo commands').to.deep.equal([]);
      sinon.assert.called(ctx.fetchDockerfileFromSourceMock.getFetchSpy());
      expect($elScope.state.sourceDockerfile, 'sourceDockerfile').to.not.equal(dockerfile);
      ctx.fetchDockerfileFromSourceMock.triggerPromise(dockerfile);
      $scope.$digest();
      expect($elScope.state.sourceDockerfile, 'sourceDockerfile').to.equal(dockerfile);

      sinon.assert.calledWith(parseDockerfileForDefaultsStub, dockerfile, ['run', 'dst']);
      $scope.$digest();
      expect($elScope.state.containerFiles[0].commands, 'main repo commands').to.deep.equal([new cardInfoTypes.Command('RUN 1234')]);
      expect($elScope.state.containerFiles[0].path, 'main repo path').to.equal('dfasgdfsgdsfgs/fgdsfgsdfg');
      sinon.assert.called(ctx.updateDockerfileFromStateMock);

    });

    it('should fetch default commands when stack is modified, without a path', function () {
      ctx.parseDockerfileResults = {
        run: ['dfadsfa', 'dsfasdfredasfadsfgw34r2 3r'],
        dst: []
      };
      $elScope.state.selectedStack = {
        key: 'hello'
      };
      $elScope.state.opts = {
        name: 'cheese'
      };
      $scope.$digest();
      var dockerfile = {attrs: 'dockerfile'};

      expect($elScope.state.startCommand, 'startCommand').to.not.equal('asdfgkasdlfk;js');
      expect($elScope.state.containerFiles[0].commands, 'main repo commands').to.deep.equal([]);
      sinon.assert.called(ctx.fetchDockerfileFromSourceMock.getFetchSpy());
      expect($elScope.state.sourceDockerfile, 'sourceDockerfile').to.not.equal(dockerfile);
      ctx.fetchDockerfileFromSourceMock.triggerPromise(dockerfile);
      $scope.$digest();
      expect($elScope.state.sourceDockerfile, 'sourceDockerfile').to.equal(dockerfile);

      sinon.assert.calledWith(parseDockerfileForDefaultsStub, dockerfile, ['run', 'dst']);
      $scope.$digest();
      expect($elScope.state.containerFiles[0].commands, 'main repo commands').to.deep.equal([
        new cardInfoTypes.Command('RUN dfadsfa'),
        new cardInfoTypes.Command('RUN dsfasdfredasfadsfgw34r2 3r')
      ]);
      expect($elScope.state.containerFiles[0].path, 'main repo path').to.equal('cheese');
      sinon.assert.called(ctx.updateDockerfileFromStateMock);
    });
  });
});
