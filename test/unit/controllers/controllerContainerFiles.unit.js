'use strict';

var apiMocks = require('../apiMocks/index');

describe('ControllerContainerFiles'.bold.underline.blue, function () {
  var CCF;
  var $controller;
  var $rootScope;
  var $scope;
  var $timeout;
  var $q;

  var loadingPromisesMock;
  var errs;
  var closePopoverSpy;
  var acvModels;

  function injectSetupCompile() {
    angular.mock.module('app');

    errs = {
      handler: sinon.spy()
    };

    angular.mock.module(function ($provide) {
      $provide.value('errs', errs);
      $provide.factory('loadingPromises', function ($q) {
        loadingPromisesMock = {
          add: sinon.stub().returns($q.when())
        };
        return loadingPromisesMock;
      });
    });

    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$timeout_,
      _$q_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $timeout = _$timeout_;
      $q = _$q_;
    });

    closePopoverSpy = sinon.spy();
    $rootScope.$on('close-popovers', closePopoverSpy);

    acvModels = [
      angular.copy(apiMocks.appCodeVersions.bitcoinAppCodeVersion)
    ];
    $scope.state = {
      contextVersion: {
        appCodeVersions: {
          models: acvModels
        }
      }
    };

    CCF = $controller('ControllerContainerFiles', {
      $scope: $scope
    });
  }
  beforeEach(function () {
    injectSetupCompile();
  });

  describe('actions', function () {
    describe('triggerAddRepository', function () {
      it('should setup the add repo popover', function () {
        CCF.actions.triggerAddRepository();
        expect(CCF.repositoryPopover.data.appCodeVersions).to.equal(acvModels);
        expect(CCF.repositoryPopover.active).to.be.ok;
        $timeout.flush();
        expect(CCF.repositoryPopover.active).to.not.be.ok;
      });
    });

    describe('triggerEditRepo', function () {
      it('should setup the add repo popover', function () {
        var clonedRepo = {cloned: true};
        var repo = {
          test: '1234',
          clone: sinon.stub().returns(clonedRepo)
        };
        CCF.actions.triggerEditRepo(repo);
        expect(CCF.repositoryPopover.data.appCodeVersions).to.equal(acvModels);
        expect(CCF.repositoryPopover.data.repo).to.equal(clonedRepo);
        expect(CCF.repositoryPopover.active).to.be.ok;
        sinon.assert.calledOnce(repo.clone);
        $timeout.flush();
        expect(CCF.repositoryPopover.active).to.not.be.ok;
      });
      it('should do nothing if it\'s a main repo', function () {
        var repo = {
          type: 'Main Repository',
          clone: sinon.spy()
        };
        CCF.actions.triggerEditRepo(repo);
        expect(CCF.repositoryPopover.data).to.be.empty;
        expect(CCF.repositoryPopover.active).to.not.be.ok;
        sinon.assert.notCalled(repo.clone);
      });
    });

    describe('triggerUploadFile', function () {
      it('should setup the add repo popover', function () {
        CCF.actions.triggerUploadFile();
        expect(CCF.fileUpload.data).to.be.empty;
        expect(CCF.fileUpload.active).to.be.ok;
        $timeout.flush();
        expect(CCF.fileUpload.active).to.not.be.ok;
      });
    });

    describe('triggerEditFile', function () {
      var file = {
        test: '1234'
      };
      it('should setup the add repo popover', function () {
        CCF.actions.triggerEditFile(file);
        expect(CCF.fileUpload.data).to.equal(file);
        expect(CCF.fileUpload.active).to.be.ok;
        $timeout.flush();
        expect(CCF.fileUpload.active).to.not.be.ok;
      });
    });
  });
});