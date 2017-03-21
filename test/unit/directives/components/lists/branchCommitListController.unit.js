'use strict';

describe.only('BranchCommitListController'.bold.underline.blue, function () {
  var $scope;
  var $rootScope;
  var $controller;
  var $q;
  var controller;

  var fetchCommitDataStub;
  var updateInstanceWithNewAcvDataStub;

  var instance;
  var repo = 'helllo/World';
  var branch = 'superBranch';
  var newCommit;
  var appCodeVersion;

  function initialize() {
    appCodeVersion = {
      attrs: {
        repo: repo,
        branch: branch,
        commit: '1',
        useLatest: false
      },
      githubRepo: 'myRepo'
    };
    instance = {
      contextVersion: {
        getMainAppCodeVersion: sinon.stub().returns(appCodeVersion),
      },
      update: sinon.spy(function (name, cb) {
        return instance;
      }),
      attrs: {
        locked: false
      },
      isolation: null
    };
    newCommit = { attrs: { sha: 2 } };

  }
  function initState() {
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.factory('fetchCommitData', function ($q) {
        fetchCommitDataStub = {
          activeBranch: sinon.stub().returns({}),
          activeCommit: sinon.stub().returns($q.when(newCommit))
        };
        return fetchCommitDataStub;
      });
      $provide.factory('updateInstanceWithNewAcvData', function ($q) {
        updateInstanceWithNewAcvDataStub = sinon.stub().returns($q.when(true));
        return updateInstanceWithNewAcvDataStub;
      });
      $provide.factory('promisify', function ($q) {
        return function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(this, arguments));
          };
        };
      });
    });

    angular.mock.inject(function (
      $compile,
      _$controller_,
      _$rootScope_,
      _$q_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $q = _$q_;

      $scope = $rootScope.$new();
      $scope.appCodeVersion = appCodeVersion;
      $scope.instance = instance;

      controller = $controller('BranchCommitListController', {
        $scope: $scope
      }, {
        appCodeVersion: appCodeVersion,
        instance: instance
      });
    });
  }
  beforeEach(function () {
    initialize();
  });
  describe('Init', function () {
    beforeEach(function () {
      initState();
    });
    it('fetch the commit', function () {
      $scope.$digest();
      sinon.assert.calledOnce(fetchCommitDataStub.activeCommit);
      sinon.assert.calledWith(fetchCommitDataStub.activeCommit, appCodeVersion);
    });
  });

  describe('updateInstance', function () {
    beforeEach(function () {
      initState();
    });

    describe('`locked`', function () {
      it('should not set the `locked` property it hasnt changed', function () {
        controller.data.locked = true;
        controller.instance.attrs.locked = true;
        controller.updateInstance();
        $scope.$digest();
        sinon.assert.notCalled(controller.instance.update);
      });

      it('should set the `locked` property to true it has changed', function () {
        controller.data.locked = true;
        controller.instance.attrs.locked = false;
        controller.updateInstance();
        $scope.$digest();
        sinon.assert.calledOnce(controller.instance.update);
        sinon.assert.calledWithExactly(controller.instance.update, {
          locked: true
        });
      });

      it('should set the `locked` property to false it has changed', function () {
        controller.data.locked = false;
        controller.instance.attrs.locked = true;
        controller.updateInstance();
        $scope.$digest();
        sinon.assert.calledOnce(controller.instance.update);
        sinon.assert.calledWithExactly(controller.instance.update, {
          locked: false
        });
      });
    });
  });
});

