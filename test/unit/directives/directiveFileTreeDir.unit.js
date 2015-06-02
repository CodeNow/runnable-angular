'use strict';
describe('directiveFileTreeDir'.bold.underline.blue, function () {
  var $scope;
  var createFsMock;
  var mockDir;
  var mockOpenItems = {};
  var mockFileModel;
  var mockParentDir = {};
  var uploadMock = {
    upload: angular.noop
  };
  var ctx;
  var $compile;
  var inputElement;
  var $elScope;
  var errs;
  var $rootScope;
  var $q;

  function injectSetupCompile() {
    mockDir = {
      attrs: {
        name: 'MyDirectory'
      },
      contents: {
        models: []
      },
      destroy: sinon.spy()
    };
    mockFileModel = {
      urlPath: 'foo',
      id: sinon.stub().returns('123')
    };
    ctx = {};
    errs = {
      handler: sinon.spy()
    };
    createFsMock = sinon.spy();
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('helperCreateFS', createFsMock);
      $provide.value('errs', errs);
      $provide.value('Upload', uploadMock);
    });

    angular.mock.inject(function (
      _$rootScope_,
      _$compile_,
      _$q_
    ) {
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $q = _$q_;
    });
    $scope.mockDir = mockDir;
    $scope.mockOpenItems = mockOpenItems;
    $scope.mockFileModel = mockFileModel;
    $scope.mockParentDir = mockParentDir;

    ctx.template = directiveTemplate.attribute('file-tree-dir', {
      'dir': 'mockDir',
      'open-items': 'mockOpenItems',
      'read-only': 'true',
      'parent-dir': 'mockParentDir',
      'file-model': 'mockFileModel', // This is either a contextVersion or a container
      'edit-explorer': 'false'
    });

    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
    inputElement = ctx.element[0].querySelector('input.tree-input');
  }
  beforeEach(function () {
    injectSetupCompile();
    sinon.spy($elScope, '$broadcast');
  });

  afterEach(function () {
    $elScope.$broadcast.restore();
  });

  describe('folder rename', function () {
    it('should work', function () {
      $elScope.editFolderName = true;
      $elScope.dir.attrs.name = 'foo';
      $elScope.dir.rename = sinon.spy();
      inputElement.value = '123';
      $elScope.actions.closeFolderNameInput();
      expect($elScope.dir.rename.calledOnce).to.equal(true);
      expect($elScope.dir.rename.calledWith('123', errs.handler)).to.equal(true);
    });

    it('should trigger close if the user hits enter', function () {
      $elScope.actions.closeFolderNameInput = sinon.spy();
      $elScope.actions.shouldCloseFolderNameInput({
        keyCode: 13
      });
      expect($elScope.actions.closeFolderNameInput.calledOnce).to.equal(true);
    });

    it('should cancel editing if the user hits escape', function () {
      $elScope.editFolderName = true;
      inputElement.value = 'New Name';
      $elScope.dir.attrs.name = 'Test';
      $elScope.actions.shouldCloseFolderNameInput({
        keyCode: 27
      });
      expect($elScope.editFolderName).to.equal(false);
      expect(inputElement.value).to.equal('Test');
    });

    it('should not trigger a rename if the folder name is not changed', function () {
      $elScope.editFolderName = true;
      $elScope.dir.attrs.name = 'foo';
      $elScope.dir.rename = sinon.spy();
      inputElement.value = 'foo';
      $elScope.actions.closeFolderNameInput();
      expect($elScope.dir.rename.calledOnce).to.equal(false);
    });

    it('should not trigger a rename if the folder is not being renamed', function () {
      $elScope.editFolderName = false;
      $elScope.dir.attrs.name = 'foo';
      $elScope.dir.rename = sinon.spy();
      inputElement.value = 'foo';
      $elScope.actions.closeFolderNameInput();
      expect($elScope.dir.rename.calledOnce).to.equal(false);
    });
  });

  describe('file rename', function () {
    it('should work', function () {
      var file = {
        state: {
          renaming: true
        },
        attrs: {
          name: 'Foo'
        },
        rename: sinon.spy()
      };
      var event = {
        currentTarget: {
          value: 'Bar'
        }
      };
      $elScope.actions.closeFileNameInput(event, file);
      expect(file.rename.calledOnce).to.equal(true);
    });

    it('should not change the file name if it has not been modified', function () {
      var file = {
        state: {
          renaming: true
        },
        attrs: {
          name: 'Foo'
        },
        rename: sinon.spy()
      };
      var event = {
        currentTarget: {
          value: 'Foo'
        }
      };
      $elScope.actions.closeFileNameInput(event, file);
      expect(file.rename.calledOnce).to.equal(false);
    });

    it('should not change the file name if its not being renamed', function () {
      var file = {
        state: {
          renaming: false
        },
        attrs: {
          name: 'Foo'
        },
        rename: sinon.spy()
      };
      var event = {
        currentTarget: {
          value: 'Bar'
        }
      };
      $elScope.actions.closeFileNameInput(event, file);
      expect(file.rename.calledOnce).to.equal(false);
    });


    it('should trigger close if the user hits enter', function () {
      $elScope.actions.closeFileNameInput = sinon.spy();
      var file = {
        state: {
          renaming: true
        },
        attrs: {
          name: 'Foo'
        },
        rename: sinon.spy()
      };
      $elScope.actions.shouldCloseFileNameInput({
        keyCode: 13
      }, file);
      expect($elScope.actions.closeFileNameInput.calledOnce).to.equal(true);
    });

    it('should cancel editing if the user hits escape', function () {
      var file = {
        state: {
          renaming: true
        },
        attrs: {
          name: 'Test'
        },
        rename: sinon.spy()
      };
      var event = {
        keyCode: 27,
        currentTarget: {
          value: 'New Name'
        }
      };
      $elScope.actions.shouldCloseFileNameInput(event, file);
      expect(event.currentTarget.value).to.equal('Test');
      expect(file.state.renaming).to.equal(false);
    });
  });



  it('should broadcast click event when triggering closeOpenModals', function () {
    sinon.spy($rootScope, '$broadcast');
    $elScope.actions.closeOpenModals();
    expect($rootScope.$broadcast.calledOnce).to.equal(true);
    $rootScope.$broadcast.restore();
  });

  it('should prevent click events from propagation when renaming files', function () {
    var event = {
      preventDefault: sinon.spy(),
      stopPropagation: sinon.spy()
    };
    var file = {
      state: {
        renaming: true
      }
    };
    $elScope.actions.handleClickOnFileInput(event, file);
    expect(event.preventDefault.calledOnce).to.equal(true);
    expect(event.stopPropagation.calledOnce).to.equal(true);
  });

  it('should prevent click events from propagation when renaming folders', function () {
    var event = {
      preventDefault: sinon.spy(),
      stopPropagation: sinon.spy()
    };
    $elScope.editFolderName = true;
    $elScope.actions.handleClickOnFolderInput(event);
    expect(event.preventDefault.calledOnce).to.equal(true);
    expect(event.stopPropagation.calledOnce).to.equal(true);
  });

  it('should return file style with progress percentage', function () {
    var style = $elScope.getFileStyle({
      state: {
        uploading: true,
        progress: 10
      }
    });
    expect(style.width).to.equal('10%');
  });

  it('should not return file style if the file is not uploading', function () {
    var style = $elScope.getFileStyle({
      state: {
        uploading: false
      }
    });
    expect(style).to.be.empty;
  });

  describe('popoverFileExplorerFolder actions', function () {
    it('should open the file when the action is triggered', function () {
      $elScope.openItems.add = sinon.spy();
      var myFile = { id: '123' };
      $elScope.actions.openFile(myFile);
      expect($elScope.openItems.add.calledOnce).to.equal(true);
      expect($elScope.openItems.add.calledWith(myFile)).to.equal(true);
    });

    it('should support creating a new file', function () {
      createFsMock.reset();
      $elScope.popoverFileExplorerFolder.actions.createFile();
      expect(createFsMock.calledOnce, 'Called create FS mock').to.equal(true);
      expect(createFsMock.lastCall.args[1].isDir, 'Is Directory').to.equal(false);
      expect($elScope.$broadcast.calledWith('close-popovers'), 'Broadcasted close-popovers').to.equal(true);
    });

    it('should support creating a new folder', function () {
      createFsMock.reset();
      $elScope.popoverFileExplorerFolder.actions.createFolder();
      expect(createFsMock.calledOnce, 'Called create FS mock').to.equal(true);
      expect(createFsMock.lastCall.args[1].isDir, 'Is Directory').to.equal(true);
      expect($elScope.$broadcast.calledWith('close-popovers'), 'Broadcasted close-popovers').to.equal(true);
    });

    it('should support deleting a folder', function () {
      $elScope.dir.destory = sinon.spy();
      $elScope.popoverFileExplorerFolder.actions.deleteFolder();
      expect($elScope.dir.destroy.calledWith(errs.handler), 'Destroy called').to.equal(true);
      expect($elScope.$broadcast.calledWith('close-popovers'), 'Broadcasted close-popovers').to.equal(true);
    });

    it('should support renaming a folder', function () {
      inputElement.focus = sinon.spy();
      inputElement.select = sinon.spy();
      $elScope.popoverFileExplorerFolder.actions.renameFolder();
      expect($elScope.$broadcast.calledWith('close-popovers'), 'Broadcasted close-popovers').to.equal(true);
      expect(inputElement.focus.calledOnce, 'Element focused').to.equal(true);
      expect(inputElement.select.calledOnce, 'Element selected').to.equal(true);
      expect($elScope.editFolderName, 'EditFolderName set').to.equal(true);
    });

    describe('file upload', function () {
      it('should support uploading a file', function () {
        var files = [
          {
            name: 'FileName.txt'
          }
        ];
        sinon.spy($elScope.dir.contents.models, 'push');
        sinon.spy($elScope.dir.contents.models, 'splice');
        $elScope.actions.fetchDirFiles = sinon.spy();

        var uploadDeferred = $q.defer();
        uploadDeferred.promise.progress = sinon.stub().returns(uploadDeferred.promise);

        uploadMock.upload = sinon.stub().returns(uploadDeferred.promise);

        $elScope.popoverFileExplorerFolder.actions.uploadFiles(files);

        expect($elScope.$broadcast.calledWith('close-popovers'), 'Broadcasted close-popovers').to.equal(true);
        expect($elScope.dir.contents.models.push.calledOnce).to.equal(true);
        expect($elScope.dir.contents.models.splice.calledOnce).to.equal(false);
        expect(uploadMock.upload.lastCall.args[0].file, 'last upload file').to.equal(files[0]);
        expect($elScope.dir.contents.models[0].state.progress, 'File upload progress').to.equal(0);

        uploadDeferred.promise.progress.lastCall.args[0]({
          loaded: 10,
          total: 100
        });
        expect($elScope.dir.contents.models[0].state.progress, 'File upload progress').to.equal(10);

        uploadDeferred.resolve();

        $elScope.$digest();

        //Upload finished
        expect(errs.handler.called, 'Error handler called').to.equal(false);
        expect($elScope.dir.contents.models.splice.calledOnce, 'Splice called').to.equal(true);
        expect($elScope.actions.fetchDirFiles.calledOnce, 'Fetch dir files called').to.equal(true);
      });

      it('should handle a failed file upload', function () {
        var files = [
          {
            name: 'FileName.txt'
          }
        ];
        sinon.spy($elScope.dir.contents.models, 'push');
        sinon.spy($elScope.dir.contents.models, 'splice');
        $elScope.actions.fetchDirFiles = sinon.spy();

        var uploadDeferred = $q.defer();
        uploadDeferred.promise.progress = sinon.stub().returns(uploadDeferred.promise);

        uploadMock.upload = sinon.stub().returns(uploadDeferred.promise);

        $elScope.popoverFileExplorerFolder.actions.uploadFiles(files);

        expect($elScope.$broadcast.calledWith('close-popovers'), 'Broadcasted close-popovers').to.equal(true);
        expect($elScope.dir.contents.models.push.calledOnce).to.equal(true);
        expect($elScope.dir.contents.models.splice.calledOnce).to.equal(false);
        expect(uploadMock.upload.lastCall.args[0].file, 'last upload file').to.equal(files[0]);
        expect($elScope.dir.contents.models[0].state.progress, 'File upload progress').to.equal(0);

        uploadDeferred.promise.progress.lastCall.args[0]({
          loaded: 10,
          total: 100
        });
        expect($elScope.dir.contents.models[0].state.progress, 'File upload progress').to.equal(10);

        uploadDeferred.reject('Oh the horror');

        $elScope.$digest();

        //Upload failed
        expect(errs.handler.calledOnce, 'Error handler called').to.equal(true);
        expect($elScope.actions.fetchDirFiles.calledOnce, 'Fetch dir files called').to.equal(true);
        expect($elScope.dir.contents.models.splice.calledOnce, 'Splice call count').to.equal(true);
      });

      it('should do nothing when there are no files to upload', function () {
        $elScope.actions.fetchDirFiles = sinon.spy();
        uploadMock.upload = sinon.stub();

        $elScope.popoverFileExplorerFolder.actions.uploadFiles();

        expect(uploadMock.upload.calledOnce).to.equal(false);
        expect(errs.handler.called, 'Error handler called').to.equal(false);
        expect($elScope.$broadcast.calledWith('close-popovers'), 'Broadcasted close-popovers').to.equal(false);
      });
    });
  });

  describe('popoverFileExplorerFile actions', function () {
    it('should support opening a file', function () {
      var file = {
        id: '123'
      };
      $elScope.openItems.add = sinon.spy();
      $elScope.popoverFileExplorerFile.actions.openFile(file);
      expect($elScope.openItems.add.calledWith(file), 'open items called with file').to.equal(true);
      expect($elScope.$broadcast.calledWith('close-popovers'), 'Broadcasted close-popovers').to.equal(true);
    });

    it('should support renaming a file', function () {
      var file = {
        state: {
          renaming: false
        }
      };
      $elScope.popoverFileExplorerFile.actions.renameFile(file);
      expect(file.state.renaming, 'File state renaming').to.equal(true);
      expect($elScope.$broadcast.calledWith('close-popovers'), 'Broadcasted close-popovers').to.equal(true);
    });

    it('should support deleting a file', function () {
      var file = {
        destroy: sinon.stub().callsArg(0)
      };
      $elScope.actions.fetchDirFiles = sinon.spy();
      $elScope.popoverFileExplorerFile.actions.deleteFile(file);
      expect(file.destroy.calledOnce, 'destroy file called').to.equal(true);
      expect($elScope.actions.fetchDirFiles.calledOnce, 'fetch dir files called once').to.equal(true);
      expect($elScope.$broadcast.calledWith('close-popovers'), 'Broadcasted close-popovers').to.equal(true);
    });
  });
});
