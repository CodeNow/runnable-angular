'use strict';

describe('branchCommitSelectorDirective'.bold.underline.blue, function () {
  var element;
  var $scope;
  var $rootScope;
  var keypather;
  var $elScope;
  var $controller;
  var $q;

  var ctx;

  function initializeCtx() {
    ctx = {};
    ctx.commits = [
      {
        name: 'This is a commit message!'
      }
    ];
    ctx.branch = {
      attrs: {
        name: 'default'
      },
      commits: {
        fetch: sinon.stub().returns({
          models: ctx.commits
        }),
        models: ctx.commits
      }
    };
  }
  function initState(scope) {
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.factory('branchSelectorDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: angular.noop
        };
      });
    });

    angular.mock.inject(function (
      $compile,
      _$controller_,
      _$rootScope_,
      _keypather_,
      _$q_
    ) {
      $controller = _$controller_;
      keypather = _keypather_;
      $rootScope = _$rootScope_;
      $q = _$q_;

      keypather.set($rootScope, 'featureFlags.additionalRepositories', true);
      $scope = $rootScope.$new();

      angular.extend($scope, scope);
      var tpl = directiveTemplate.attribute('branch-commit-selector', {
        'data': 'data'
      });
      element = $compile(tpl)($scope);
      $elScope = element.isolateScope();
      $scope.$digest();
    });
  }
  beforeEach(function () {
    initializeCtx();
  });
  describe('basics', function () {
    beforeEach(function () {
      initState({
        data: {
          branch: ctx.branch
        }
      });
    });
    // I cant test the scope!

    //it('Check the scope', function () {
    //  //Should fetch once the branch is set
    //  $scope.$digest();
    //  console.log($elScope);
    //  expect($elScope.BCSC.data.branch, 'data.branch').to.equal(ctx.branch);
    //
    //  expect($elScope.fetchingCommits, 'fetchingCommits').to.be.true;
    //  sinon.assert.called(ctx.branch.commits.fetch);
    //  $scope.$digest();
    //  expect($elScope.fetchingCommits, 'fetchingCommits').to.be.false;
    //
    //  $rootScope.$destroy();
    //});
  });
});
