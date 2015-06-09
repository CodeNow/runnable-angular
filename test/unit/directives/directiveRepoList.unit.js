'use strict';

describe.only('directiveRepoList'.bold.underline.blue, function() {
  var $compile;
  var $scope;
  var $elScope;
  var ctx;
  var $rootScope;
  function setup() {
    ctx = {};
    angular.mock.inject(function (
      _$compile_,
      _$rootScope_
    ) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
    });

    ctx.mainAcv = {
      update: sinon.spy()
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
      update: sinon.spy()
    };

    $scope.instance = ctx.instance;
    ctx.template = directiveTemplate.attribute('repo-list', {
      'instance': 'instance'
    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();


    console.log(ctx.element);
    console.log($elScope);
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

});
