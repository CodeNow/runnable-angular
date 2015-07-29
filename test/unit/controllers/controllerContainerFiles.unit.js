'use strict';

var apiMocks = require('../apiMocks/index');

describe('ControllerContainerFiles'.bold.underline.blue, function () {
  var CCF;
  var $controller;
  var $rootScope;
  var $scope;
  var $timeout;
  var keypather;
  var uploadMock = {
    upload: angular.noop
  };
  var $q;

  var loadingPromises;
  var errs;
  var closePopoverSpy;
  var acvModels;
  var promisifyMock;
  var updateDockerfileFromStateMock;

  function injectSetupCompile() {
    angular.mock.module('app');

    errs = {
      handler: sinon.spy()
    };

    angular.mock.module(function ($provide) {
      $provide.value('errs', errs);
      $provide.value('Upload', uploadMock);
      $provide.factory('updateDockerfileFromState', function ($q) {
        updateDockerfileFromStateMock = sinon.stub().returns($q.when());
        return updateDockerfileFromStateMock;
      });
      $provide.factory('promisify', function ($q) {
        promisifyMock = sinon.spy(function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(obj, arguments));
          };
        });
        return promisifyMock;
      });
    });

    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$timeout_,
      _loadingPromises_,
      _keypather_,
      _$q_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $timeout = _$timeout_;
      loadingPromises = _loadingPromises_;
      keypather = _keypather_;
      $q = _$q_;
    });

    sinon.spy(loadingPromises, 'add');
    closePopoverSpy = sinon.spy();
    $rootScope.$on('close-popovers', closePopoverSpy);

    acvModels = [
      {
        id: apiMocks.appCodeVersions.bitcoinAppCodeVersion._id,
        attrs: apiMocks.appCodeVersions.bitcoinAppCodeVersion
      }
    ];
    $scope.state = {
      containerFiles: [],
      contextVersion: {
        appCodeVersions: {
          models: acvModels
        },
        rootDir: {
          contents: {
            create: sinon.spy(),
            fetch: sinon.spy()
          }
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

  describe('dropContainerFile', function () {
    it('should move the dropped file around', function () {

      var obj1 =  {
        id: 1
      };
      var obj2=  {
        id: 2
      };
      var obj3 =  {
        id: 3
      };
      $scope.state.containerFiles = [obj1, obj2, obj3];

      CCF.dropContainerFile({}, 2, obj1.id);

      expect($scope.state.containerFiles[0].id).to.equal(2);
      expect($scope.state.containerFiles[1].id).to.equal(1);
      expect($scope.state.containerFiles[2].id).to.equal(3);

      sinon.assert.calledOnce(updateDockerfileFromStateMock);
    });
    it('should not move the dropped file around if it\'s going to the same spot', function () {

      var obj1 =  {
        id: 1
      };
      var obj2=  {
        id: 2
      };
      var obj3 =  {
        id: 3
      };
      $scope.state.containerFiles = [obj1, obj2, obj3];

      CCF.dropContainerFile({}, 0, obj1.id);

      expect($scope.state.containerFiles[0].id).to.equal(1);
      expect($scope.state.containerFiles[1].id).to.equal(2);
      expect($scope.state.containerFiles[2].id).to.equal(3);

      sinon.assert.calledOnce(updateDockerfileFromStateMock);
    });
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
      it('should setup the edit repo popover', function () {
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
      it('should setup the add file popover', function () {
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
      it('should setup the edit file popover', function () {
        CCF.actions.triggerEditFile(file);
        expect(CCF.fileUpload.data).to.equal(file);
        expect(CCF.fileUpload.active).to.be.ok;
        $timeout.flush();
        expect(CCF.fileUpload.active).to.not.be.ok;
      });
    });
    describe('triggerAddSSHKey', function () {
      var file = {
        test: '1234'
      };
      it('should setup the edit file popover', function () {
        CCF.actions.triggerAddSSHKey(file);
        expect(CCF.sshKey.popover.active).to.be.ok;
        $timeout.flush();
        expect(CCF.sshKey.popover.active).to.not.be.ok;
      });
    });
  });

  describe('repository popover actions', function () {
    describe('remove', function () {
      it('should remove the repository from containerFiles and app code versions', function () {
        var acv = acvModels[0];
        var repoContainerFile = {
          id: '1234',
          repo: {
            attrs: {
              name: acv.attrs.repo.split('/')[1]
            }
          }
        };
        $scope.state.containerFiles = [{
          id: '4567'
        }, repoContainerFile];

        acv.destroy = sinon.stub().returns($q.when());

        CCF.repositoryPopover.actions.remove(repoContainerFile);
        $rootScope.$digest();

        sinon.assert.calledOnce(acv.destroy);
        expect($scope.state.containerFiles.length).to.equal(1);
        expect($scope.state.containerFiles[0]).to.deep.equal({id: '4567'});
        sinon.assert.calledOnce(loadingPromises.add);
        sinon.assert.calledWith(loadingPromises.add, 'editServerModal');
        sinon.assert.calledOnce(updateDockerfileFromStateMock);
      });
    });
    describe('create', function () {
      it('should create new app code version and add to containerFiles array', function () {
        var newACV = {id: 'newACV'};
        $scope.state.contextVersion.appCodeVersions.create = sinon.stub().returns(newACV);
        var repoContainerFile = {
          id: Math.random(),
          repo: {
            attrs: {
              full_name: 'full_name'
            }
          },
          branch: {
            attrs: {
              name: 'branch'
            }
          },
          commit: {
            attrs: {
              sha: 'commitSha'
            }
          }
        };
        CCF.repositoryPopover.actions.create(repoContainerFile);
        $timeout.flush();
        $rootScope.$digest();

        sinon.assert.calledOnce($scope.state.contextVersion.appCodeVersions.create);
        sinon.assert.calledWith($scope.state.contextVersion.appCodeVersions.create, {
          repo: 'full_name',
          branch: 'branch',
          commit: 'commitSha',
          additionalRepo: true
        });

        expect($scope.state.containerFiles.length).to.equal(1);
        expect($scope.state.containerFiles[0].id).to.equal(repoContainerFile.id);
        expect($scope.state.containerFiles[0].acv).to.equal(newACV);
        sinon.assert.notCalled(errs.handler);
        sinon.assert.calledOnce(updateDockerfileFromStateMock);
      });
    });
    describe('update', function () {
      it('should update the container file', function () {
        var acv = acvModels[0];
        var newACV = {id: 'newACV'};
        acv.update = sinon.stub().returns(newACV);

        var repoContainerFile = {
          id: Math.random(),
          repo: {
            attrs: {
              full_name: 'full_name'
            }
          },
          branch: {
            attrs: {
              name: 'branch'
            }
          },
          commit: {
            attrs: {
              sha: 'commitSha'
            }
          },
          acv: acv
        };
        $scope.state.containerFiles = [{
          id: '4567'
        }, repoContainerFile];

        var newRepoContainerFile = angular.copy(repoContainerFile);
        newRepoContainerFile.branch.attrs.name = 'newBranch';
        newRepoContainerFile.commit.attrs.sha = 'newSha';

        CCF.repositoryPopover.actions.update(newRepoContainerFile);
        $rootScope.$digest();

        sinon.assert.calledOnce(acv.update);
        sinon.assert.calledWith(acv.update, {
          branch: 'newBranch',
          commit: 'newSha'
        });
        expect(repoContainerFile.acv).to.equal(newACV);
        sinon.assert.calledOnce(updateDockerfileFromStateMock);
      });
    });
  });

  describe('file upload actions', function () {
    describe('uploadFile', function () {
      it('should not upload a file if there was no file to upload', function () {
        var containerFile = {
          file: []
        };
        CCF.fileUpload.actions.uploadFile(containerFile);
      });
      it('should upload the file', function () {
        var file = {
          name: 'testFileUpload'
        };
        var containerFile = {
          file: [file]
        };

        $scope.state.contextVersion.id = sinon.stub().returns(1234);
        $scope.state.contextVersion.newFile = sinon.stub().returns({newFile: 1});

        var uploadDeferred = $q.defer();
        uploadDeferred.promise.progress = sinon.stub().returns(uploadDeferred.promise);
        uploadDeferred.promise.error = sinon.stub().returns(uploadDeferred.promise);
        uploadDeferred.promise.success = sinon.stub().returns(uploadDeferred.promise);

        uploadMock.upload = sinon.stub().returns(uploadDeferred.promise);

        CCF.fileUpload.actions.uploadFile(containerFile);


        uploadDeferred.promise.progress.lastCall.args[0]({
          loaded: 10,
          total: 100
        });
        $rootScope.$digest();
        expect(containerFile.progress, 'File upload progress').to.equal(10);
        uploadDeferred.promise.success.lastCall.args[0]({
          name: 'newName'
        });
        uploadDeferred.resolve();
        $rootScope.$digest();
        expect(containerFile.uploadFinished).to.be.ok;
        expect(containerFile.name).to.equal('newName');
        expect(containerFile.fileModel).to.deep.equal({newFile: 1});
        expect(containerFile.saving).to.not.be.ok;
      });
    });
    describe('save', function () {
      it('should save a file', function () {
        var containerFile = {
          file: [{
            name: 'testName'
          }],
          commands: [{command:1}],
          path: 'foo/bar'
        };
        $scope.state.containerFiles = [{id: '4567'}];

        CCF.fileUpload.actions.save(containerFile);

        sinon.assert.calledOnce(closePopoverSpy);
        expect($scope.state.containerFiles.length).to.equal(2);
        var newContainerFile = $scope.state.containerFiles[1];
        expect(newContainerFile.name).to.equal(containerFile.file[0].name);
        expect(newContainerFile.commands).to.equal(containerFile.commands);
        expect(newContainerFile.path).to.equal(containerFile.path);
        expect(newContainerFile.type).to.equal('File');
        sinon.assert.calledOnce(updateDockerfileFromStateMock);
      });
      it('should do nothing if there already is a type', function () {
        CCF.fileUpload.actions.save({
          type: 'File'
        });
        sinon.assert.calledOnce(closePopoverSpy);
      });
      it('should handle when there is no file', function () {
        var containerFile = {
          commands: [{command:1}],
          path: 'foo/bar'
        };
        $scope.state.containerFiles = [{id: '4567'}];

        CCF.fileUpload.actions.save(containerFile);

        sinon.assert.calledOnce(closePopoverSpy);
        expect($scope.state.containerFiles.length).to.equal(2);
        var newContainerFile = $scope.state.containerFiles[1];
        expect(newContainerFile.name).to.not.be.ok;
        expect(newContainerFile.commands).to.equal(containerFile.commands);
        expect(newContainerFile.path).to.equal(containerFile.path);
        expect(newContainerFile.type).to.equal('File');
      });
    });
    describe('cancel', function () {
      it('should delete a file that is already uploaded', function () {
        var containerFile = {
          uploadFinished: true,
          fileUpload: {}
        };
        CCF.fileUpload.actions.deleteFile = sinon.spy();
        CCF.fileUpload.actions.cancel(containerFile);

        sinon.assert.notCalled(closePopoverSpy);
        sinon.assert.calledOnce(CCF.fileUpload.actions.deleteFile);
        sinon.assert.calledWith(CCF.fileUpload.actions.deleteFile, containerFile);
      });
      it('should stop uploading a file in progress', function () {
        var containerFile = {
          uploadFinished: false,
          fileUpload: {
            abort: sinon.spy()
          }
        };
        CCF.fileUpload.actions.deleteFile = sinon.spy();
        CCF.fileUpload.actions.cancel(containerFile);

        sinon.assert.calledOnce(closePopoverSpy);
        sinon.assert.calledOnce(containerFile.fileUpload.abort);
      });
      it('should close the popover if there is no file upload', function () {
        CCF.fileUpload.actions.cancel({});
        sinon.assert.calledOnce(closePopoverSpy);
      });
    });
    describe('deleteFile', function () {
      it('should delete a file when the file model is on the container file', function () {
        var containerFile = {
          id: Math.random(),
          fileModel: {
            destroy: sinon.stub().returns($q.when({}))
          }
        };
        $scope.state.containerFiles = [{
          id: '4567'
        }, containerFile];

        CCF.fileUpload.actions.deleteFile(containerFile);
        $rootScope.$digest();

        sinon.assert.calledOnce(closePopoverSpy);
        sinon.assert.calledOnce(containerFile.fileModel.destroy);
        expect($scope.state.containerFiles.length).to.equal(1);
        expect($scope.state.containerFiles[0].id).to.equal('4567');
        sinon.assert.calledOnce(updateDockerfileFromStateMock);
      });
      it('should find the file model based on file name', function () {
        var fileModel = {
          destroy: sinon.stub().returns($q.when({})),
          attrs: {
            name: 'FileName'
          }
        };
        keypather.set($scope, 'state.contextVersion.rootDir.contents.models', [fileModel]);
        var containerFile = {
          id: Math.random(),
          name: 'FileName'
        };
        $scope.state.containerFiles = [{
          id: '4567',
          name: 'fileName'
        }, containerFile];

        CCF.fileUpload.actions.deleteFile(containerFile);
        $rootScope.$digest();

        sinon.assert.calledOnce(closePopoverSpy);
        sinon.assert.calledOnce(fileModel.destroy);
        expect($scope.state.containerFiles.length).to.equal(1);
        expect($scope.state.containerFiles[0].id).to.equal('4567');
        sinon.assert.calledOnce(updateDockerfileFromStateMock);
      });
      it('should do nothing if the file model diesn\'t exist', function () {
        keypather.set($scope, 'state.contextVersion.rootDir.contents.models', []);
        var containerFile = {
          id: Math.random(),
          name: 'FileName'
        };
        $scope.state.containerFiles = [{
          id: '4567',
          name: 'fileName'
        }, containerFile];

        CCF.fileUpload.actions.deleteFile(containerFile);
        sinon.assert.calledOnce(closePopoverSpy);
        expect($scope.state.containerFiles.length).to.equal(2);
      });

      it('should handle when the container file doesn\'t exist in the state', function () {
        keypather.set($scope, 'state.contextVersion.rootDir.contents.models', []);
        var containerFile = {
          id: Math.random(),
          name: 'FileName',
          fileModel: {
            destroy: sinon.spy()
          }
        };
        $scope.state.containerFiles = [];

        CCF.fileUpload.actions.deleteFile(containerFile);
        sinon.assert.calledOnce(closePopoverSpy);
        sinon.assert.calledOnce(containerFile.fileModel.destroy);
      });
    });
  });
  describe('SSH Key', function () {
    describe('popover actions', function () {
      describe('save', function () {
        it('should create a new SSH key and create that in the file system', function () {
          var newFile = {
            id: 'New File'
          };
          $scope.state.contextVersion.rootDir.contents.create = sinon.stub().returns(newFile);
          $scope.state.containerFiles = [{
            id: 1234
          }];

          CCF.sshKey.popover.actions.save({
            name: 'fileName',
            key: 'keyValue'
          });
          $rootScope.$digest();

          expect($scope.state.containerFiles.length).to.equal(2);
          expect($scope.state.containerFiles[0].name).to.equal('fileName');
          expect($scope.state.containerFiles[0].fileModel).to.equal(newFile);

          sinon.assert.calledOnce($scope.state.contextVersion.rootDir.contents.create);
          sinon.assert.calledWith($scope.state.contextVersion.rootDir.contents.create, {
            name: 'fileName',
            path: '/',
            body: 'keyValue',
            isDir: false
          });

          sinon.assert.calledOnce(loadingPromises.add);
          sinon.assert.calledWith(loadingPromises.add, 'editServerModal');
          sinon.assert.calledOnce($scope.state.contextVersion.rootDir.contents.fetch);
          sinon.assert.calledOnce(updateDockerfileFromStateMock);
          sinon.assert.calledOnce(closePopoverSpy);
        });
      });
      describe('remove', function () {
        it('should use the file model if its on the sshKey', function () {
          var sshKey = {
            fileModel: {
              destroy: sinon.spy()
            }
          };
          $scope.state.containerFiles = [{
            id: 1234
          }, sshKey];

          CCF.sshKey.popover.actions.remove(sshKey);
          $rootScope.$digest();

          sinon.assert.calledTwice(loadingPromises.add);
          sinon.assert.calledWith(loadingPromises.add, 'editServerModal');
          sinon.assert.calledOnce(sshKey.fileModel.destroy);
          sinon.assert.calledOnce($scope.state.contextVersion.rootDir.contents.fetch);
          sinon.assert.calledOnce(updateDockerfileFromStateMock);
          sinon.assert.calledOnce(closePopoverSpy);
          expect($scope.state.containerFiles.length).to.equal(1);
        });
        it('should locate the file model in rootDir', function () {
          var fileModel = {
            attrs: {
              name: 'myFile'
            },
            destroy: sinon.spy()
          };
          $scope.state.contextVersion.rootDir.contents.models = [{id: 1234, attrs: {name: 'test12354'}}, fileModel];
          var sshKey = {
            name: 'myFile'
          };
          $scope.state.containerFiles = [{
            id: 1234
          }, sshKey];

          CCF.sshKey.popover.actions.remove(sshKey);
          $rootScope.$digest();

          sinon.assert.calledTwice(loadingPromises.add);
          sinon.assert.calledWith(loadingPromises.add, 'editServerModal');
          sinon.assert.calledOnce(fileModel.destroy);
          sinon.assert.calledOnce($scope.state.contextVersion.rootDir.contents.fetch);
          sinon.assert.calledOnce(updateDockerfileFromStateMock);
          sinon.assert.calledOnce(closePopoverSpy);
          expect($scope.state.containerFiles.length).to.equal(1);
        });
      });
      it('should handle when it can\'t locate the file', function () {
        $scope.state.contextVersion.rootDir.contents.models = [{id: 1234, attrs: {name: 'test12354'}}];
        var sshKey = {
          name: 'myFile'
        };
        $scope.state.containerFiles = [{
          id: 1234
        }, sshKey];

        CCF.sshKey.popover.actions.remove(sshKey);
        $rootScope.$digest();

        sinon.assert.calledOnce(loadingPromises.add);
        sinon.assert.calledWith(loadingPromises.add, 'editServerModal');
        sinon.assert.calledOnce(updateDockerfileFromStateMock);
        sinon.assert.calledOnce(closePopoverSpy);
        expect($scope.state.containerFiles.length).to.equal(1);
      });
      it('should handle when it can\'t find the container file', function () {
        var fileModel = {
          attrs: {
            name: 'myFile'
          },
          destroy: sinon.spy()
        };
        $scope.state.contextVersion.rootDir.contents.models = [{id: 1234, attrs: {name: 'test12354'}}, fileModel];
        var sshKey = {
          name: 'myFile'
        };
        $scope.state.containerFiles = [{
          id: 1234
        }];

        CCF.sshKey.popover.actions.remove(sshKey);
        $rootScope.$digest();

        sinon.assert.calledTwice(loadingPromises.add);
        sinon.assert.calledWith(loadingPromises.add, 'editServerModal');
        sinon.assert.calledOnce(fileModel.destroy);
        sinon.assert.calledOnce($scope.state.contextVersion.rootDir.contents.fetch);
        sinon.assert.calledOnce(updateDockerfileFromStateMock);
        sinon.assert.calledOnce(closePopoverSpy);
        expect($scope.state.containerFiles.length).to.equal(1);
      });
    });
    describe('getFileDate', function () {
      it('should return the file date if the file object is set on the containerFile', function () {
        var fileModel = {
          attrs: {
            name: 'myFile',
            created: 'Woot I was created!'
          }
        };
        var sshKey = {
          name: 'myFile',
          fileModel: fileModel
        };
        var date = CCF.sshKey.getFileDate(sshKey);
        expect(date).to.equal('Woot I was created!');
      });
      it('should find the file if the container file doesnt have the file object on it', function () {
        var fileModel = {
          attrs: {
            name: 'myFile',
            created: 'Woot I was created!'
          }
        };
        var sshKey = {
          name: 'myFile'
        };
        $scope.state.contextVersion.rootDir.contents.models = [{id: 1234, attrs: {name: 'test12354'}}, fileModel];
        var date = CCF.sshKey.getFileDate(sshKey);
        expect(date).to.equal('Woot I was created!');
        expect(sshKey.fileModel).to.equal(fileModel);
      });
    });
  });
  describe('filePopoverActions', function () {
    describe('edit', function () {
      it('should trigger edit for a repo', function () {
        var containerFile = {
          type: 'Repository'
        };
        CCF.actions.triggerEditRepo = sinon.spy();
        CCF.filePopoverActions.edit(containerFile);
        sinon.assert.calledOnce(CCF.actions.triggerEditRepo);
      });
      it('should trigger edit for a file', function () {
        var containerFile = {
          type: 'File'
        };
        CCF.actions.triggerEditFile = sinon.spy();
        CCF.filePopoverActions.edit(containerFile);
        sinon.assert.calledOnce(CCF.actions.triggerEditFile);
      });
      it('should not trigger edit for an SSH Key', function () {
        var containerFile = {
          type: 'SSH Key'
        };
        CCF.actions.triggerEditRepo = sinon.spy();
        CCF.actions.triggerEditFile = sinon.spy();
        CCF.filePopoverActions.edit(containerFile);
        sinon.assert.notCalled(CCF.actions.triggerEditRepo);
        sinon.assert.notCalled(CCF.actions.triggerEditFile);
      });
    });
    describe('delete', function () {
      it('should trigger delete for a repo', function () {
        var containerFile = {
          type: 'Repository'
        };
        CCF.repositoryPopover.actions.remove = sinon.spy();
        CCF.fileUpload.actions.deleteFile = sinon.spy();
        CCF.sshKey.popover.actions.remove = sinon.spy();

        CCF.filePopoverActions.delete(containerFile);

        sinon.assert.calledOnce(CCF.repositoryPopover.actions.remove);
        sinon.assert.notCalled(CCF.fileUpload.actions.deleteFile);
        sinon.assert.notCalled(CCF.sshKey.popover.actions.remove);
      });
      it('should trigger delete for a file', function () {
        var containerFile = {
          type: 'File'
        };
        CCF.repositoryPopover.actions.remove = sinon.spy();
        CCF.fileUpload.actions.deleteFile = sinon.spy();
        CCF.sshKey.popover.actions.remove = sinon.spy();

        CCF.filePopoverActions.delete(containerFile);

        sinon.assert.notCalled(CCF.repositoryPopover.actions.remove);
        sinon.assert.calledOnce(CCF.fileUpload.actions.deleteFile);
        sinon.assert.notCalled(CCF.sshKey.popover.actions.remove);
      });
      it('should trigger delete for an SSH Key', function () {
        var containerFile = {
          type: 'SSH Key'
        };
        CCF.repositoryPopover.actions.remove = sinon.spy();
        CCF.fileUpload.actions.deleteFile = sinon.spy();
        CCF.sshKey.popover.actions.remove = sinon.spy();

        CCF.filePopoverActions.delete(containerFile);

        sinon.assert.notCalled(CCF.repositoryPopover.actions.remove);
        sinon.assert.notCalled(CCF.fileUpload.actions.deleteFile);
        sinon.assert.calledOnce(CCF.sshKey.popover.actions.remove);
      });
      it('should do nothing if its not a match', function () {
        var containerFile = {
          type: 'Not A Match'
        };
        CCF.repositoryPopover.actions.remove = sinon.spy();
        CCF.fileUpload.actions.deleteFile = sinon.spy();
        CCF.sshKey.popover.actions.remove = sinon.spy();

        CCF.filePopoverActions.delete(containerFile);

        sinon.assert.notCalled(CCF.repositoryPopover.actions.remove);
        sinon.assert.notCalled(CCF.fileUpload.actions.deleteFile);
        sinon.assert.notCalled(CCF.sshKey.popover.actions.remove);
      });
    });
  });
});