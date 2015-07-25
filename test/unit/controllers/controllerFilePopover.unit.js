'use strict';
describe('directiveFileTreeDir'.bold.underline.blue, function () {
  var CFP;
  var $controller;
  var $rootScope;
  var $scope;
  var $timeout;
  var $q;
  var configAPIHost;

  var createFsMock;
  var loadingPromisesMock;
  var errs;
  var dirMock;
  var closePopoverSpy;
  var uploadMock = {
    upload: sinon.spy()
  };
  var mockFileModel;

  function injectSetupCompile() {
    angular.mock.module('app');
    createFsMock = sinon.spy();

    mockFileModel = {
      urlPath: 'foo',
      id: sinon.stub().returns('123'),
      appCodeVersions: {
        create: sinon.spy()
      }
    };

    loadingPromisesMock = function ($q) {
      return {
        add: sinon.spy(function () {
          return $q.when(1);
        })
      };
    };

    errs = {
      handler: sinon.spy()
    };

    angular.mock.module(function ($provide) {
      $provide.value('helperCreateFSpromise', createFsMock);
      $provide.value('errs', errs);
      $provide.value('Upload', uploadMock);
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
      _$q_,
      _configAPIHost_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $timeout = _$timeout_;
      $q = _$q_;
      configAPIHost = _configAPIHost_;
    });


    closePopoverSpy = sinon.spy();
    $rootScope.$on('close-popovers', closePopoverSpy);


    dirMock = {
      attrs: {
        name: 'MyDirectory'
      },
      contents: {
        models: [],
        fetch: sinon.spy()
      },
      destroy: sinon.spy()
    };
    sinon.spy(dirMock.contents.models, 'push');
    sinon.spy(dirMock.contents.models, 'splice');
    $scope.dir = dirMock;
    $scope.fileModel = mockFileModel;
    $scope.actions = {};
    $scope.state = {};


    CFP = $controller('ControllerFilePopover', {
      $scope: $scope
    });
  }
  beforeEach(function () {
    injectSetupCompile();
  });

  describe('actions', function () {
    describe('createFile', function () {
      it('should create the file', function () {
        CFP.actions.createFile();
        sinon.assert.calledOnce(loadingPromisesMock.add);
        sinon.assert.calledWith(loadingPromisesMock.add, CFP.loadingPromisesTarget);
        sinon.assert.calledOnce(createFsMock);
        sinon.assert.calledWith(createFsMock, dirMock, {isDir: false});
        sinon.assert.calledOnce(closePopoverSpy);
        sinon.assert.notCalled(errs.handler);
      });
    });
    describe('createFolder', function () {
      it('should create the folder', function () {
        CFP.actions.createFolder();
        sinon.assert.calledOnce(loadingPromisesMock.add);
        sinon.assert.calledWith(loadingPromisesMock.add, CFP.loadingPromisesTarget);
        sinon.assert.calledOnce(createFsMock);
        sinon.assert.calledWith(createFsMock, dirMock, {isDir: true});
        sinon.assert.calledOnce(closePopoverSpy);
        sinon.assert.notCalled(errs.handler);
      });
    });

    describe('renameFolder', function () {
      it('should emit events to trigger renaming a folder', function () {
        $scope.actions.focusInputElement = sinon.spy();
        CFP.actions.renameFolder();
        expect($scope.editFolderName).to.be.ok;
        sinon.assert.calledOnce($scope.actions.focusInputElement);
        sinon.assert.calledOnce(closePopoverSpy);
        sinon.assert.notCalled(errs.handler);
      });
    });

    describe('deleteFolder', function () {
      it('should support deleting a folder', function () {
        CFP.actions.deleteFolder();
        sinon.assert.calledOnce(loadingPromisesMock.add);
        sinon.assert.calledWith(loadingPromisesMock.add, CFP.loadingPromisesTarget);
        sinon.assert.calledOnce(dirMock.destroy);
        sinon.assert.calledOnce(closePopoverSpy);
        sinon.assert.notCalled(errs.handler);
      });
    });


    describe('uploadFiles', function () {
      it('should support uploading a file', function () {
        var files = [
          {
            name: 'FileName.txt'
          }
        ];
        var uploadDeferred = $q.defer();
        uploadDeferred.promise.progress = sinon.stub().returns(uploadDeferred.promise);
        uploadMock.upload = sinon.stub().returns(uploadDeferred.promise);

        CFP.actions.uploadFiles(files);

        sinon.assert.calledOnce(closePopoverSpy);
        sinon.assert.calledOnce(dirMock.contents.models.push);
        sinon.assert.notCalled(dirMock.contents.models.splice);
        sinon.assert.calledOnce(uploadMock.upload);
        expect(uploadMock.upload.lastCall.args[0].url).to.equal(configAPIHost + '/foo/123/files');
        expect(uploadMock.upload.lastCall.args[0].file).to.equal(files[0]);
        expect(dirMock.contents.models[0].state.progress, 'File upload progress').to.equal(0);
        uploadDeferred.promise.progress.lastCall.args[0]({
          loaded: 10,
          total: 100
        });
        expect(dirMock.contents.models[0].state.progress, 'File upload progress').to.equal(10);
        uploadDeferred.resolve();
        $rootScope.$digest();

        sinon.assert.calledOnce(dirMock.contents.models.splice);
        sinon.assert.calledOnce(dirMock.contents.fetch);
        sinon.assert.notCalled(errs.handler);
      });

      it('should handle a failed file upload', function () {
        var files = [
          {
            name: 'FileName.txt'
          }
        ];
        var uploadDeferred = $q.defer();
        uploadDeferred.promise.progress = sinon.stub().returns(uploadDeferred.promise);
        uploadMock.upload = sinon.stub().returns(uploadDeferred.promise);

        CFP.actions.uploadFiles(files);

        sinon.assert.calledOnce(closePopoverSpy);
        sinon.assert.calledOnce(dirMock.contents.models.push);
        sinon.assert.notCalled(dirMock.contents.models.splice);
        sinon.assert.calledOnce(uploadMock.upload);
        expect(uploadMock.upload.lastCall.args[0].url).to.equal(configAPIHost + '/foo/123/files');
        expect(uploadMock.upload.lastCall.args[0].file).to.equal(files[0]);
        expect(dirMock.contents.models[0].state.progress, 'File upload progress').to.equal(0);
        uploadDeferred.promise.progress.lastCall.args[0]({
          loaded: 10,
          total: 100
        });
        expect(dirMock.contents.models[0].state.progress, 'File upload progress').to.equal(10);
        uploadDeferred.reject('Oh the horror');
        $rootScope.$digest();

        sinon.assert.calledOnce(dirMock.contents.models.splice);
        sinon.assert.calledOnce(dirMock.contents.fetch);
        sinon.assert.calledOnce(errs.handler);
        sinon.assert.calledWith(errs.handler, 'Oh the horror');
      });

      it('should handle a failed fetch of file contents and eat container not found errors', function () {
        var files = [
          {
            name: 'FileName.txt'
          }
        ];
        dirMock.contents.fetch = sinon.spy(function (cb) {
          cb({
            message: 'Container not found'
          });
          return {};
        });


        var uploadDeferred = $q.defer();
        uploadDeferred.promise.progress = sinon.stub().returns(uploadDeferred.promise);
        uploadMock.upload = sinon.stub().returns(uploadDeferred.promise);

        CFP.actions.uploadFiles(files);

        sinon.assert.calledOnce(closePopoverSpy);
        sinon.assert.calledOnce(dirMock.contents.models.push);
        sinon.assert.notCalled(dirMock.contents.models.splice);
        sinon.assert.calledOnce(uploadMock.upload);
        expect(uploadMock.upload.lastCall.args[0].url).to.equal(configAPIHost + '/foo/123/files');
        expect(uploadMock.upload.lastCall.args[0].file).to.equal(files[0]);
        expect(dirMock.contents.models[0].state.progress, 'File upload progress').to.equal(0);
        uploadDeferred.promise.progress.lastCall.args[0]({
          loaded: 10,
          total: 100
        });
        expect(dirMock.contents.models[0].state.progress, 'File upload progress').to.equal(10);
        uploadDeferred.resolve();
        $rootScope.$digest();

        sinon.assert.calledOnce(dirMock.contents.models.splice);
        sinon.assert.calledOnce(dirMock.contents.fetch);
        sinon.assert.notCalled(errs.handler);
      });

      it('should handle a failed fetch of file contents and emit errors', function () {
        var files = [
          {
            name: 'FileName.txt'
          }
        ];
        dirMock.contents.fetch = sinon.spy(function (cb) {
          cb({
            message: 'This is a test'
          });
          return {};
        });

        var uploadDeferred = $q.defer();
        uploadDeferred.promise.progress = sinon.stub().returns(uploadDeferred.promise);
        uploadMock.upload = sinon.stub().returns(uploadDeferred.promise);

        CFP.actions.uploadFiles(files);

        sinon.assert.calledOnce(closePopoverSpy);
        sinon.assert.calledOnce(dirMock.contents.models.push);
        sinon.assert.notCalled(dirMock.contents.models.splice);
        sinon.assert.calledOnce(uploadMock.upload);
        expect(uploadMock.upload.lastCall.args[0].url).to.equal(configAPIHost + '/foo/123/files');
        expect(uploadMock.upload.lastCall.args[0].file).to.equal(files[0]);
        expect(dirMock.contents.models[0].state.progress, 'File upload progress').to.equal(0);
        uploadDeferred.promise.progress.lastCall.args[0]({
          loaded: 10,
          total: 100
        });
        expect(dirMock.contents.models[0].state.progress, 'File upload progress').to.equal(10);
        uploadDeferred.resolve();
        $rootScope.$digest();

        sinon.assert.calledOnce(dirMock.contents.models.splice);
        sinon.assert.calledOnce(dirMock.contents.fetch);
        sinon.assert.calledOnce(errs.handler);
        sinon.assert.calledWith(errs.handler, {message: 'This is a test'});
      });

      it('should do nothing when there are no files to upload', function () {
        var uploadDeferred = $q.defer();
        uploadDeferred.promise.progress = sinon.stub().returns(uploadDeferred.promise);
        uploadMock.upload = sinon.stub().returns(uploadDeferred.promise);

        CFP.actions.uploadFiles();

        sinon.assert.notCalled(closePopoverSpy);
        sinon.assert.notCalled(dirMock.contents.models.push);
        sinon.assert.notCalled(dirMock.contents.models.splice);
        sinon.assert.notCalled(uploadMock.upload);
        sinon.assert.notCalled(errs.handler);
      });
    });

    describe('addRepository', function () {
      it('should trigger the add repository state', function () {
        CFP.actions.addRepository();
        sinon.assert.calledOnce(closePopoverSpy);
        expect($scope.state.showAddRepo).to.not.be.ok;
        $timeout.flush();
        expect($scope.state.showAddRepo).to.be.ok;
      });
    });
  });
});
