'use strict';

describe('updateInstanceWithNewAcvData'.bold.underline.blue, function () {
  var ctx;
  var $rootScope;
  var eventTracking;
  var keypather;
  var apiMocks = require('../apiMocks/index');
  var updateInstanceWithNewAcvData;
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
      _keypather_,
      _eventTracking_,
      _updateInstanceWithNewAcvData_
    ) {
      $rootScope = _$rootScope_;
      eventTracking = _eventTracking_;
      keypather = _keypather_;
      updateInstanceWithNewAcvData = _updateInstanceWithNewAcvData_;
    });

    sinon.stub(eventTracking, 'toggledCommit', noop);

    ctx.mainAcv = {
      attrs: apiMocks.appCodeVersions.notAbitcoinAppCodeVersion,
      update: sinon.stub()
    };
    ctx.otherAcv = {
      attrs: apiMocks.appCodeVersions.bitcoinAppCodeVersion,
      update: sinon.stub()
    };
    ctx.ctxVersion = {
      appCodeVersions: {
        models: [
          ctx.mainAcv,
          ctx.otherAcv
        ]
      },
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
  }

  beforeEach(function () {
    setup();
  });

  it('should rebuild the instance when updating the main repo', function () {
    var repoObject = {
      branch: {
        attrs: apiMocks.branches.bitcoinRepoBranches[1]
      },
      commit: {
        attrs: apiMocks.commit.bitcoinRepoCommit1
      }
    };
    updateInstanceWithNewAcvData(ctx.instance, ctx.mainAcv, repoObject);

    $rootScope.$digest();

    sinon.assert.calledOnce(ctx.instance.build.deepCopy);
    sinon.assert.calledOnce(ctx.deepCopyBuild.contextVersions.models[0].fetch);

    sinon.assert.calledOnce(ctx.mainAcv.update);
    sinon.assert.calledWith(ctx.mainAcv.update, {
      branch: apiMocks.branches.bitcoinRepoBranches[1].name,
      commit: apiMocks.commit.bitcoinRepoCommit1.sha,
      useLatest: false
    });

    sinon.assert.calledOnce(ctx.deepCopyBuild.build);

    sinon.assert.calledOnce(ctx.instance.update);
    sinon.assert.calledWith(ctx.instance.update, {build: ctx.buildId});
  });

  it('should rebuild the instance when updating a different repo', function () {
    var repoObject = {
      branch: {
        attrs: apiMocks.branches.bitcoinRepoBranches[5]
      },
      commit: {
        attrs: apiMocks.commit.bitcoinRepoCommit2
      },
      useLatest: true
    };
    updateInstanceWithNewAcvData(ctx.instance, ctx.otherAcv, repoObject);

    $rootScope.$digest();

    sinon.assert.calledOnce(ctx.instance.build.deepCopy);
    sinon.assert.calledOnce(ctx.deepCopyBuild.contextVersions.models[0].fetch);

    sinon.assert.calledOnce(ctx.otherAcv.update);
    sinon.assert.calledWith(ctx.otherAcv.update, {
      branch: apiMocks.branches.bitcoinRepoBranches[5].name,
      commit: apiMocks.commit.bitcoinRepoCommit2.sha,
      useLatest: true
    });

    sinon.assert.calledOnce(ctx.deepCopyBuild.build);

    sinon.assert.calledOnce(ctx.instance.update);
    sinon.assert.calledWith(ctx.instance.update, {build: ctx.buildId});
  });

});
