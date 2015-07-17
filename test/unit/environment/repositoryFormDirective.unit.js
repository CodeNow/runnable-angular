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

  var apiMocks = require('../apiMocks/index');
  function setup(scope, updateError) {
    ctx = {};
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
    });
    angular.mock.inject(function (
      _$compile_,
      _$timeout_,
      _$rootScope_,
      _loadingPromises_,
      _keypather_
    ) {
      $timeout = _$timeout_;
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
      loadingPromises = _loadingPromises_;
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
      $scope.$digest();
      $elScope = ctx.element.isolateScope();
      $scope.$digest();
      expect($elScope.data).to.deep.equal({
        cacheCommand: false
      });
      expect($elScope.state).to.equal(scope.state);
      expect($elScope.startCommandCanDisable).to.be.true;
      $rootScope.$destroy();
    });
  });
});
