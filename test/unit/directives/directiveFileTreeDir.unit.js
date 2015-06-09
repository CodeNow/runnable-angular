'use strict';
describe('directiveFileTreeDir'.bold.underline.blue, function () {
  var $scope;
  var createFsMock;
  var mockDir;
  var mockOpenItems = {};
  var mockFileModel;
  var mockParentDir = {};
  var fetchCommitDataMock;
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
  var keypather;
  var loadingPromisesMock;


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
      id: sinon.stub().returns('123'),
      appCodeVersions: {
        create: sinon.spy()
      }
    };
    loadingPromisesMock = {
      add: sinon.spy(function () {
        return $q.when(1);
      })
    };
    ctx = {};
    errs = {
      handler: sinon.spy()
    };

    fetchCommitDataMock = {
      activeBranch: sinon.spy(),
      activeCommit: sinon.spy(),
      branchCommits: sinon.spy()
    };
    createFsMock = sinon.spy();
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('helperCreateFSpromise', createFsMock);
      $provide.value('errs', errs);
      $provide.value('Upload', uploadMock);
      $provide.value('fetchCommitData', fetchCommitDataMock);
      $provide.value('loadingPromises', loadingPromisesMock);
    });

    angular.mock.inject(function (
      _$rootScope_,
      _$compile_,
      _$q_,
      _keypather_,
      _loadingPromises_
    ) {
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $q = _$q_;
      keypather = _keypather_;
    });
    $scope.mockDir = mockDir;
    $scope.mockOpenItems = mockOpenItems;
    $scope.mockFileModel = mockFileModel;
    $scope.mockParentDir = mockParentDir;
    $scope.loadingPromisesTarget = 'test';

    ctx.template = directiveTemplate.attribute('file-tree-dir', {
      'dir': 'mockDir',
      'open-items': 'mockOpenItems',
      'read-only': 'true',
      'parent-dir': 'mockParentDir',
      'file-model': 'mockFileModel', // This is either a contextVersion or a container
      'edit-explorer': 'false',
      'loading-promises-target': 'loadingPromisesTarget'
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
      $scope.loadingPromisesTarget = 'createFile';
      $scope.$digest();
      $elScope.popoverFileExplorerFolder.actions.createFile();
      expect(loadingPromisesMock.add.lastCall.args[0], 'Added to loading promise').to.equal('createFile');
      expect(createFsMock.calledOnce, 'Called create FS mock').to.equal(true);
      expect(createFsMock.lastCall.args[1].isDir, 'Is Directory').to.equal(false);
      expect($elScope.$broadcast.calledWith('close-popovers'), 'Broadcasted close-popovers').to.equal(true);
    });

    it('should support creating a new folder', function () {
      createFsMock.reset();
      $scope.loadingPromisesTarget = 'create';
      $scope.$digest();
      $elScope.popoverFileExplorerFolder.actions.createFolder();
      expect(loadingPromisesMock.add.lastCall.args[0], 'Added to loading promise').to.equal('create');
      expect(createFsMock.calledOnce, 'Called create FS mock').to.equal(true);
      expect(createFsMock.lastCall.args[1].isDir, 'Is Directory').to.equal(true);
      expect($elScope.$broadcast.calledWith('close-popovers'), 'Broadcasted close-popovers').to.equal(true);
    });

    it('should support deleting a folder', function () {
      $elScope.dir.destory = sinon.spy();
      $scope.loadingPromisesTarget = 'delete';
      $scope.$digest();
      $elScope.popoverFileExplorerFolder.actions.deleteFolder();
      expect(loadingPromisesMock.add.lastCall.args[0], 'Added to loading promise').to.equal('delete');
      expect($elScope.dir.destroy.calledOnce, 'Destroy called').to.equal(true);
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

  describe('popoverFileExplorerRepository actions', function () {
    it('should support deleting a repo', function () {
      var acv = {
        destroy: sinon.stub().callsArg(0)
      };

      $scope.loadingPromisesTarget = 'deleteRepo';
      $scope.$digest();
      $elScope.popoverFileExplorerRepository.actions.deleteRepo(acv);
      expect(loadingPromisesMock.add.lastCall.args[0], 'Added to loading promise').to.equal('deleteRepo');
      $scope.$digest();
      sinon.assert.calledOnce(acv.destroy);
      sinon.assert.calledWith($elScope.$broadcast, 'close-popovers');
    });
    it('should support editing a repo', function () {
      var acv = {};
      $elScope.popoverFileExplorerRepository.actions.editRepo(acv);
      $scope.$digest();
      sinon.assert.calledOnce(fetchCommitDataMock.activeBranch);
      sinon.assert.calledOnce(fetchCommitDataMock.activeCommit);
      sinon.assert.calledOnce(fetchCommitDataMock.branchCommits);
    });
  });

  describe('popoverFilesRepositoryCommitToggle actions', function () {
    it('should support creating a new repo', function () {
      var repo = {};
      keypather.set(repo, 'repo.attrs.full_name', 'fullName');
      keypather.set(repo, 'branch.attrs.name', 'branchName');
      keypather.set(repo, 'commit.attrs.sha', 'commitSha');

      $scope.loadingPromisesTarget = 'create';
      $scope.$digest();
      $elScope.popoverFilesRepositoryCommitToggle.actions.create(repo);
      $scope.$digest();

      sinon.assert.calledOnce(loadingPromisesMock.add);
      expect(loadingPromisesMock.add.lastCall.args[0], 'Added to loading promise').to.equal('create');
      sinon.assert.calledOnce(mockFileModel.appCodeVersions.create);
      sinon.assert.calledWith(mockFileModel.appCodeVersions.create, {
        repo: 'fullName',
        branch: 'branchName',
        commit: 'commitSha',
        additionalRepo: true
      });
    });
    it('should support removing a repo', function () {
      var repo = {};
      keypather.set(repo, 'repo.attrs.name', 'RepoName');
      mockFileModel.appCodeVersions.models = [{
        attrs: {
          repo: 'CodeNow/RepoName'
        },
        destroy: sinon.stub().callsArg(0)
      }];

      $scope.loadingPromisesTarget = 'remove';
      $scope.$digest();
      $elScope.popoverFilesRepositoryCommitToggle.actions.remove(repo);
      $scope.$digest();

      sinon.assert.calledOnce(loadingPromisesMock.add);
      expect(loadingPromisesMock.add.lastCall.args[0], 'Added to loading promise').to.equal('remove');
      sinon.assert.calledOnce(mockFileModel.appCodeVersions.models[0].destroy);
    });
    it('should support updating a repo', function () {
      var repo = {};
      keypather.set(repo, 'acv.attrs.repo', 'CodeNow/RepoName');
      keypather.set(repo, 'branch.attrs.name', 'branchName');
      keypather.set(repo, 'commit.attrs.sha', 'commitSha');
      mockFileModel.appCodeVersions.models = [{
        attrs: {
          repo: 'CodeNow/RepoName'
        },
        update: sinon.stub().callsArg(1)
      }];

      $scope.loadingPromisesTarget = 'update';
      $scope.$digest();
      $elScope.popoverFilesRepositoryCommitToggle.actions.update(repo);
      $scope.$digest();

      sinon.assert.calledOnce(loadingPromisesMock.add);
      expect(loadingPromisesMock.add.lastCall.args[0], 'Added to loading promise').to.equal('update');
      sinon.assert.calledOnce(mockFileModel.appCodeVersions.models[0].update);
      sinon.assert.calledWith(mockFileModel.appCodeVersions.models[0].update, {
        branch: 'branchName',
        commit: 'commitSha'
      });
    });
  });

  it('should return true if we are editing a repository', function () {
    mockFileModel.appCodeVersions.models = [{
      editing: true
    }];
    expect($elScope.isEditingRepo()).to.be.ok;
  });
  it('should return false if we arent editing a repository', function () {
    mockFileModel.appCodeVersions.models = [{}];
    expect($elScope.isEditingRepo()).to.not.be.ok;
  });
});
