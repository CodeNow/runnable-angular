'use strict';

describe('directiveRepoList'.bold.underline.blue, function() {
  var $compile;
  var $scope;
  var $elScope;
  var ctx;
  var $rootScope;
  var keypather;
  function setup() {
    angular.mock.module('app');

    angular.mock.module(function ($provide) {
      $provide.factory('promisify', function ($q) {
        return function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(this, arguments));
          };
        };
      });
    });


    ctx = {};
    angular.mock.inject(function (
      _$compile_,
      _$rootScope_,
      _keypather_
    ) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
    });

    ctx.mainAcv = {
      update: sinon.stub()
    };
    ctx.ctxVersion = {
      getMainAppCodeVersion: sinon.stub().returns(ctx.mainAcv)
    };
    ctx.buildId = 'buildId1234';
    ctx.build = {
      id: sinon.stub().returns(ctx.buildId)
    };
    ctx.deepCopyBuild = {
      contextVersions: {
        models: [
          {
            fetch: sinon.stub().returns(ctx.ctxVersion)
          }
        ]
      },
      build: sinon.stub().returns(ctx.build)
    };
    ctx.instance = {
      build: {
        deepCopy: sinon.stub().returns(ctx.deepCopyBuild)
      },
      update: sinon.stub()
    };

    $scope.instance = ctx.instance;
    ctx.template = directiveTemplate.attribute('repo-list', {
      'instance': 'instance'
    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  beforeEach(function () {
    setup();
  });

  it('should rebuild the instance on update-commit', function () {
    var newCommitSha = 'newCommitSha123';

    $scope.$broadcast('change-commit', newCommitSha);
    $scope.$digest();

    sinon.assert.calledOnce(ctx.instance.build.deepCopy);
    sinon.assert.calledOnce(ctx.deepCopyBuild.contextVersions.models[0].fetch);
    sinon.assert.calledOnce(ctx.ctxVersion.getMainAppCodeVersion);

    sinon.assert.calledOnce(ctx.mainAcv.update);
    sinon.assert.calledWith(ctx.mainAcv.update, {
      commit: newCommitSha
    });

    sinon.assert.calledOnce(ctx.deepCopyBuild.build);


    sinon.assert.calledOnce(ctx.instance.update);
    sinon.assert.calledWith(ctx.instance.update, {build: ctx.buildId});
  });


  it('should trigger update on change of locked attribute', function () {
    keypather.set($scope, 'instance.attrs.locked', true);

    $scope.$digest();

    sinon.assert.calledOnce(ctx.instance.update);
    sinon.assert.calledWith(ctx.instance.update, {locked: true});
  });

});
