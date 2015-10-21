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
    var FilePopoverController = function () {
      this.actions = {
        rename: sinon.spy()
      };
      ctx.mockFilePopoverController = this;
    };
    createFsMock = sinon.spy();
    angular.mock.module('app');
    angular.mock.module(function ($provide, $controllerProvider) {
      $controllerProvider.register('FilePopoverController', FilePopoverController);
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
      _keypather_
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
      'edit-explorer': 'editExplorer',
      'loading-promises-target': 'loadingPromisesTarget'
    });

    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
    inputElement = ctx.element[0].querySelector('input.tree-input');
  }
  beforeEach(function () {
    injectSetupCompile();
    sinon.spy($rootScope, '$broadcast');
  });

  afterEach(function () {
    $rootScope.$broadcast.restore();
  });

  describe('folder rename', function () {
    it('should work', function () {
      $elScope.editFolderName = true;
      $elScope.dir.attrs.name = 'foo';
      $elScope.dir.rename = sinon.spy();
      inputElement.value = '123';
      $elScope.actions.closeFolderNameInput();

      sinon.assert.calledOnce(ctx.mockFilePopoverController.actions.rename);
      sinon.assert.calledWith(ctx.mockFilePopoverController.actions.rename, $elScope.dir, '123');
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

  describe('drop', function () {
    it('should not work if old path is the same', function () {
      var dataTransfer = {
        getData: function (prop) {
          if (prop === 'modelType') {
            return 'Dir';
          }
          if (prop === 'modelId') {
            return 'some-id';
          }
          if (prop === 'modelName') {
            return 'some-name';
          }
          if (prop === 'oldPath') {
            return '/some/dir';
          }
          return null;
        }
      };
      var toDir = {
        id: function () {
          return '/some/dir/'
        }
      };
      var result = $elScope.actions.drop(dataTransfer, toDir);
      expect(result).to.equal(false);
    });
    it('should not work if both pathes are root', function () {
      var dataTransfer = {
        getData: function (prop) {
          if (prop === 'modelType') {
            return 'Dir';
          }
          if (prop === 'modelId') {
            return 'some-id';
          }
          if (prop === 'modelName') {
            return 'some-name';
          }
          if (prop === 'oldPath') {
            return '/';
          }
          return null;
        }
      };
      var toDir = {
        id: function () {
          return '/'
        }
      };
      var result = $elScope.actions.drop(dataTransfer, toDir);
      expect(result).to.equal(false);
    });

    it('should be able to move file from root', function () {
      var dataTransfer = {
        getData: function (prop) {
          if (prop === 'modelType') {
            return 'File';
          }
          if (prop === 'modelId') {
            return '/some-id.txt';
          }
          if (prop === 'modelName') {
            return 'some-name';
          }
          if (prop === 'oldPath') {
            return '/';
          }
          return null;
        }
      };
      var toDir = {
        id: function () {
          return '/dir1'
        },
        contents: {
          fetch: sinon.spy()
        }
      };
      var FileModel = function () {};
      FileModel.prototype.moveToDir = function (toDir, cb) {
        cb();
      };
      $elScope.fileModel = {
        newFile: function (id, opts) {
          var fm = new FileModel();
          return fm;
        },
        rootDir: {
          contents: {
            fetch: sinon.spy()
          }
        }
      };
      $scope.loadingPromisesTarget = 'moveToDir';
      $scope.$digest();
      sinon.spy($elScope.fileModel, 'newFile');
      var moveToDirSpy = sinon.spy(FileModel.prototype, 'moveToDir');
      var result = $elScope.actions.drop(dataTransfer, toDir);
      sinon.assert.calledOnce(loadingPromisesMock.add);
      $scope.$digest();
      sinon.assert.calledOnce($elScope.fileModel.newFile);
      sinon.assert.calledOnce(moveToDirSpy);
      expect(moveToDirSpy.lastCall.args[0].id()).to.equal('/dir1');
      sinon.assert.calledOnce($elScope.fileModel.rootDir.contents.fetch);
      sinon.assert.calledOnce(toDir.contents.fetch);
    });

    it('should be able to move file from nested dir', function () {
      var dataTransfer = {
        getData: function (prop) {
          if (prop === 'modelType') {
            return 'File';
          }
          if (prop === 'modelId') {
            return '/dir2/some-id.txt';
          }
          if (prop === 'modelName') {
            return 'some-name';
          }
          if (prop === 'oldPath') {
            return '/dir2';
          }
          return null;
        }
      };
      var toDir = {
        id: function () {
          return '/dir1'
        },
        contents: {
          fetch: sinon.spy()
        }
      };
      var FileModel = function () {};
      FileModel.prototype.moveToDir = function (toDir, cb) {
        cb();
      };
      $elScope.fileModel = {
        newFile: function (id, opts) {
          var fm = new FileModel();
          return fm;
        },
        rootDir: {
          contents: {
            fetch: sinon.spy(),
            models: [
              {
                attrs: {
                  isDir: true
                },
                id: function () {
                  return '/dir2/'
                },
                contents: {
                  fetch: sinon.spy()
                }
              }
            ]
          }
        }
      };
      $scope.loadingPromisesTarget = 'moveToDir';
      $scope.$digest();
      sinon.spy($elScope.fileModel, 'newFile');
      var moveToDirSpy = sinon.spy(FileModel.prototype, 'moveToDir');
      var result = $elScope.actions.drop(dataTransfer, toDir);
      sinon.assert.calledOnce(loadingPromisesMock.add);
      $scope.$digest();
      sinon.assert.calledOnce($elScope.fileModel.newFile);
      sinon.assert.calledOnce(moveToDirSpy);
      expect(moveToDirSpy.lastCall.args[0].id()).to.equal('/dir1');
      sinon.assert.calledOnce($elScope.fileModel.rootDir.contents.models[0].contents.fetch);
      sinon.assert.calledOnce(toDir.contents.fetch);
    });

    it('should be able to move file from super nested dir', function () {
      var dataTransfer = {
        getData: function (prop) {
          if (prop === 'modelType') {
            return 'File';
          }
          if (prop === 'modelId') {
            return '/dir2/dir3/some-id.txt';
          }
          if (prop === 'modelName') {
            return 'some-name';
          }
          if (prop === 'oldPath') {
            return '/dir2/dir3';
          }
          return null;
        }
      };
      var toDir = {
        id: function () {
          return '/dir1'
        },
        contents: {
          fetch: sinon.spy()
        }
      };
      var FileModel = function () {};
      FileModel.prototype.moveToDir = function (toDir, cb) {
        cb();
      };
      $elScope.fileModel = {
        newFile: function (id, opts) {
          var fm = new FileModel();
          return fm;
        },
        rootDir: {
          id: function () {
            return '/';
          },
          contents: {
            models: [
              {
                attrs: {
                  isDir: true
                },
                id: function () {
                  return '/dir2/'
                },
                contents: {
                  models: [
                    {
                      attrs: {
                        isDir: true
                      },
                      id: function () {
                        return '/dir2/dir3/'
                      },
                      contents: {
                        fetch: sinon.spy()
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      };
      $scope.loadingPromisesTarget = 'moveToDir';
      $scope.$digest();
      sinon.spy($elScope.fileModel, 'newFile');
      var moveToDirSpy = sinon.spy(FileModel.prototype, 'moveToDir');
      var result = $elScope.actions.drop(dataTransfer, toDir);
      sinon.assert.calledOnce(loadingPromisesMock.add);
      $scope.$digest();
      sinon.assert.calledOnce($elScope.fileModel.newFile);
      sinon.assert.calledOnce(moveToDirSpy);
      expect(moveToDirSpy.lastCall.args[0].id()).to.equal('/dir1');
      sinon.assert.calledOnce($elScope.fileModel.rootDir.contents.models[0].contents.models[0].contents.fetch);
      sinon.assert.calledOnce(toDir.contents.fetch);
    });
    it('should not call fetch on folder that wasnot found', function () {
      var dataTransfer = {
        getData: function (prop) {
          if (prop === 'modelType') {
            return 'File';
          }
          if (prop === 'modelId') {
            return '/dir2/dir3/some-id.txt';
          }
          if (prop === 'modelName') {
            return 'some-name';
          }
          if (prop === 'oldPath') {
            return '/dir2/dir3';
          }
          return null;
        }
      };
      var toDir = {
        id: function () {
          return '/dir1'
        },
        contents: {
          fetch: sinon.spy()
        }
      };
      var FileModel = function () {};
      FileModel.prototype.moveToDir = function (toDir, cb) {
        cb();
      };
      $elScope.fileModel = {
        newFile: function (id, opts) {
          var fm = new FileModel();
          return fm;
        },
        rootDir: {
          id: function () {
            return '/';
          },
          contents: {
            models: [
              {
                attrs: {
                  isDir: true
                },
                id: function () {
                  return '/dir2/'
                },
                contents: {
                  models: [
                    {
                      attrs: {
                        isDir: true
                      },
                      id: function () {
                        return '/dir2/dir4/'
                      },
                      contents: {
                        fetch: sinon.spy()
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      };
      $scope.loadingPromisesTarget = 'moveToDir';
      $scope.$digest();
      sinon.spy($elScope.fileModel, 'newFile');
      var moveToDirSpy = sinon.spy(FileModel.prototype, 'moveToDir');
      var result = $elScope.actions.drop(dataTransfer, toDir);
      sinon.assert.calledOnce(loadingPromisesMock.add);
      $scope.$digest();
      sinon.assert.calledOnce($elScope.fileModel.newFile);
      sinon.assert.calledOnce(moveToDirSpy);
      expect(moveToDirSpy.lastCall.args[0].id()).to.equal('/dir1');
      expect($elScope.fileModel.rootDir.contents.models[0].contents.models[0].contents.fetch.calledOnce).to.equal(false);
      sinon.assert.calledOnce(toDir.contents.fetch);
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
      sinon.assert.calledOnce(ctx.mockFilePopoverController.actions.rename);
      sinon.assert.calledWith(ctx.mockFilePopoverController.actions.rename, file, 'Bar');
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
    $elScope.actions.closeOpenModals();
    expect($rootScope.$broadcast.calledOnce).to.equal(true);
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

  describe('popoverFileExplorerFile actions', function () {
    it('should support opening a file', function () {
      var file = {
        id: '123'
      };
      $elScope.openItems.add = sinon.spy();
      $elScope.popoverFileExplorerFile.actions.openFile(file);
      expect($elScope.openItems.add.calledWith(file), 'open items called with file').to.equal(true);
      expect($rootScope.$broadcast.calledWith('close-popovers'), 'Broadcasted close-popovers').to.equal(true);
    });

    it('should support renaming a file', function () {
      var file = {
        state: {
          renaming: false
        }
      };
      $elScope.popoverFileExplorerFile.actions.renameFile(file);
      expect(file.state.renaming, 'File state renaming').to.equal(true);
      expect($rootScope.$broadcast.calledWith('close-popovers'), 'Broadcasted close-popovers').to.equal(true);
    });

    it('should support deleting a file', function () {
      var file = {
        destroy: sinon.stub().callsArg(0)
      };
      $elScope.actions.fetchDirFiles = sinon.spy();
      $elScope.popoverFileExplorerFile.actions.deleteFile(file);
      $rootScope.$digest();

      expect(file.destroy.calledOnce, 'destroy file called').to.equal(true);
      expect($elScope.actions.fetchDirFiles.calledOnce, 'fetch dir files called once').to.equal(true);
      expect($rootScope.$broadcast.calledWith('close-popovers'), 'Broadcasted close-popovers').to.equal(true);
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
      sinon.assert.calledWith($rootScope.$broadcast, 'close-popovers');
    });
    it('should support editing a repo', function () {
      $scope.editExplorer = true;
      $scope.$digest();

      var acv = {
        attrs: {
          useLatest: false
        }
      };
      $elScope.popoverFileExplorerRepository.actions.editRepo(acv);
      $scope.$digest();
      sinon.assert.calledOnce(fetchCommitDataMock.activeBranch);
      sinon.assert.calledOnce(fetchCommitDataMock.activeCommit);
      sinon.assert.calledOnce(fetchCommitDataMock.branchCommits);
    });
  });

  describe('popoverFilesRepositoryCommitToggle actions', function () {
    beforeEach(function () {
      $scope.editExplorer = true;
      $scope.$digest();
    });
    it('should support creating a new repo', function () {
      var repo = {
        useLatest: false
      };
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
        additionalRepo: true,
        useLatest: false
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
      var repo = {
        useLatest: false
      };
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
        commit: 'commitSha',
        useLatest: false
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
