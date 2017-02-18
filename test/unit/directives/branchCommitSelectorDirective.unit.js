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
      $provide.factory('github', function ($q) {
        ctx.github = {
          branchCommits: sinon.spy(function (acv) {
            return $q.when(ctx.commits);
          })
        };
        return ctx.github;
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

      $scope = $rootScope.$new();

      angular.extend($scope, scope);
      var tpl = directiveTemplate.attribute('branch-commit-selector', {
        'data': 'data'
      });
      element = $compile(tpl)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
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

    it('Check the scope', function () {
      //Should fetch once the branch is set
      $scope.$digest();
      expect($elScope.BCSC.data.branch, 'data.branch').to.equal(ctx.branch);
      sinon.assert.called(ctx.github.branchCommits);
      expect($elScope.fetchingCommits, 'fetchingCommits').to.be.false;
      $rootScope.$destroy();
    });
  });
});
