'use strict';

require('app')
  .directive('fileTreeDir', fileTreeDir);
/**
 * fileTreeDir Directive
 * @ngInject
 */
function fileTreeDir(
  $rootScope,
  keypather,
  errs,
  $q,
  promisify,
  fetchCommitData,
  cardInfoTypes,
  loadingPromises
) {
  return {
    restrict: 'A',
    replace: true,
    controller: 'FilePopoverController as FPC',
    scope: {
      dir: '=',
      parentDir: '=',
      fileModel: '=', // This is either a contextVersion or a container
      openItems: '=',
      readOnly: '=',
      editExplorer: '=',
      showRepoFolder: '=',
      isRootDir: '=?',
      state: '=?',
      loadingPromisesTarget: '=',
      getDisplayName: '=?'
    },
    templateUrl: 'fileTreeDirView',
    link: function ($scope, element) {

      var actions = $scope.actions = {};
      $scope.data = {};
      var inputElement = element[0].querySelector('input.tree-input');

      $scope.editFolderName = false;
      $scope.editFileName = false;
      $scope.data = {};

      $scope.normalizeRepoNames = function (repo) {
        return repo.replace(/[a-zA-Z0-9]+\//, '');
      };


      $scope.actions.shouldCloseFolderNameInput = function (event) {
        if (event.keyCode === 13) {
          $scope.actions.closeFolderNameInput();
        } else if (event.keyCode === 27) {
          $scope.editFolderName = false;
          inputElement.value = $scope.dir.attrs.name;
        }
      };

      $scope.actions.closeFolderNameInput = function () {
        if (!$scope.editFolderName) {
          return;
        }
        $scope.editFolderName = false;
        var newValue = inputElement.value;
        if (newValue) {
          newValue = newValue.trim();
        }
        if (newValue === $scope.dir.attrs.name) {
          return;
        }
        return $scope.FPC.actions.rename($scope.dir, newValue);
      };

      actions.handleClickOnFolderInput = function (event) {
        if ($scope.editFolderName) {
          $rootScope.$broadcast('close-popovers');
          event.preventDefault();
          event.stopPropagation();
        }
      };

      $scope.actions.shouldCloseFileNameInput = function (event, file) {
        if (event.keyCode === 13) {
          $scope.actions.closeFileNameInput(event, file);
        } else if (event.keyCode === 27) {
          file.state.renaming = false;
          event.currentTarget.value = file.attrs.name;
        }
      };
      $scope.actions.closeFileNameInput = function (event, file) {
        if (!file.state.renaming) {
          return;
        }
        file.state.renaming = false;

        var newValue = event.currentTarget.value;
        if (newValue) {
          newValue = newValue.trim();
        }
        if (newValue === file.attrs.name) {
          return;
        }
        return $scope.FPC.actions.rename(file, newValue);
      };

      $scope.actions.focusInputElement = function () {
        inputElement.focus();
        inputElement.select();
      };

      actions.handleClickOnFileInput = function (event, file) {
        if (file.state.renaming) {
          $rootScope.$broadcast('close-popovers');
          event.preventDefault();
          event.stopPropagation();
        }
      };

      function findDir (searchDir, dirPath) {
        // searchDir is rootDir
        if (dirPath === '/') {
          return searchDir;
        }
        var dirs = searchDir.contents.models.filter(function (item) {
          return item.attrs.isDir;
        });
        var finalDir = dirs.find(function (item) {
          return item.id() === dirPath;
        });
        if (finalDir) {
          return finalDir;
        }
        var searchDirPath = searchDir.id();
        var dirPathWithoutParent = dirPath.substr(searchDirPath.length);
        var nextSearchDirName = dirPathWithoutParent.split('/')[0];
        var nextSearchDirPath = searchDirPath + nextSearchDirName  + '/';
        var nextSearchDir = dirs.find(function (item) {
          return item.id() === nextSearchDirPath;
        });
        if (nextSearchDir) {
          return findDir(nextSearchDir, dirPath);
        }
        return null;
      }

      $scope.actions.drop = function (dataTransfer, toDir) {
        var modelType = dataTransfer.getData('modelType');
        var modelId = dataTransfer.getData('modelId');

        var oldPath = dataTransfer.getData('oldPath');
        if (oldPath !== '/') {
          oldPath += '/';
        }
        var thisPath = toDir.id();
        if (oldPath === thisPath) {
          return false;
        }

        var newModel = $scope.fileModel['new' + modelType](modelId, { warn: false });
        var fromDir = findDir($scope.fileModel.rootDir, oldPath);
        loadingPromises.add($scope.loadingPromisesTarget, promisify(newModel, 'moveToDir')(toDir))
          .then(function () {
            var toDirFetch = loadingPromises.add(
              $scope.loadingPromisesTarget, promisify(toDir.contents, 'fetch')());
            var fetches = [ toDirFetch ];
            if (fromDir) {
              var fromDirFetch = loadingPromises.add(
                $scope.loadingPromisesTarget, promisify(fromDir.contents, 'fetch')());
              fetches.push(fromDirFetch);
            }
            return $q.all(fetches);
          });
      };

      actions.closeOpenModals = function () {
        $rootScope.$broadcast('app-document-click');
      };

      actions.openFile = function (file) {
        $scope.openItems.add(file);
      };

      $scope.getFileStyle = function (file) {
        if (!file.state.uploading) {
          return {};
        }
        return {
          width: file.state.progress + '%'
        };
      };

      $scope.popoverFileExplorerFolder = {
        data: {
          canUpload: $scope.editExplorer
        },
        options: {
          top: -16,
          left: 10,
          mouse: true,
          pinToViewPort: true
        }
      };

      $scope.popoverFileExplorerFile = {
        canUpload: $scope.editExplorer,
        options: {
          top: -16,
          left: 10,
          pinToViewPort: true
        },
        actions: {
          openFile: function (file) {
            $scope.openItems.add(file);
            $rootScope.$broadcast('close-popovers');
          },
          renameFile: function (file) {
            keypather.set(file, 'state.renaming', true);
            $rootScope.$broadcast('close-popovers');
          },
          deleteFile: function (file) {
            $rootScope.$broadcast('close-popovers');
            promisify(file, 'destroy')()
              .then(function () {
                return $scope.actions.fetchDirFiles();
              })
              .catch(errs.handler);
          }
        }
      };

      $scope.isEditingRepo = function () {
        return keypather.get($scope, 'fileModel.appCodeVersions') &&
          $scope.fileModel.appCodeVersions.models.find(function (acv) {
            return acv.editing;
          });
      };

      $scope.popoverFileExplorerRepository = {
        actions: {
          editRepo: function (acv) {
            var Repository = cardInfoTypes.Repository;
            var repo = new Repository();

            repo.acv = acv;
            repo.repo = acv.githubRepo;
            repo.branch = fetchCommitData.activeBranch(acv);
            fetchCommitData.activeCommit(acv)
              .then(function (commit) {
                repo.commit = commit;
              });
            fetchCommitData.branchCommits(repo.branch);

            repo.useLatest = acv.attrs.useLatest;

            $scope.popoverEditRepoCommit.data.repo = repo;
            acv.editing = true;
          },
          deleteRepo: function (acv) {
            loadingPromises.add($scope.loadingPromisesTarget, promisify(acv, 'destroy')())
              .catch(errs.handler)
              .finally(function () {
                $rootScope.$broadcast('close-popovers');
              });
          }
        }
      };
      $scope.popoverEditRepoCommit = {
        data: {
          gitDataOnly: true,
          getDisplayName: $scope.getDisplayName
        }
      };
      $scope.popoverFilesRepositoryCommitToggle = {
        data: {
          gitDataOnly: true,
          getDisplayName: $scope.getDisplayName
        },
        actions: {
          create: function (repo) {
            loadingPromises.add(
              $scope.loadingPromisesTarget,
              promisify($scope.fileModel.appCodeVersions, 'create', true)({
                repo: repo.repo.attrs.full_name,
                branch: repo.branch.attrs.name,
                commit: repo.commit.attrs.sha,
                additionalRepo: true,
                useLatest: repo.useLatest
              })
            )
              .catch(errs.handler);
          },
          remove: function (repo) {
            var acv = $scope.fileModel.appCodeVersions.models.find(function (acv) {
              return acv.attrs.repo.split('/')[1] === repo.repo.attrs.name;
            });
            loadingPromises.add($scope.loadingPromisesTarget, promisify(acv, 'destroy')())
              .catch(errs.handler);
          },
          update: function (repo) {
            var acv = $scope.fileModel.appCodeVersions.models.find(function (acv) {
              return acv.attrs.repo === repo.acv.attrs.repo;
            });

            loadingPromises.add($scope.loadingPromisesTarget, promisify(acv, 'update')({
              branch: repo.branch.attrs.name,
              commit: repo.commit.attrs.sha,
              useLatest: repo.useLatest
            }))
              .catch(errs.handler);
          }
        }
      };

      if ($scope.editExplorer) {
        $scope.$watch('fileModel.appCodeVersions', function (n) {
          if (!n) { return; }
          keypather.set($scope, 'popoverEditRepoCommit.data.appCodeVersions', n);
          keypather.set($scope, 'popoverFilesRepositoryCommitToggle.data.appCodeVersions', n);
        });
      }

      // http://www.bennadel.com/blog/2495-user-friendly-sort-of-alpha-numeric-data-in-javascript.htm
      function normalizeMixedDataValue(file) {
        var padding = '000000000000000';
        // Loop over all numeric values in the string and
        // replace them with a value of a fixed-width for
        // both leading (integer) and trailing (decimal)
        // padded zeroes.
        var value = file.attrs.name.replace(
          /(\d+)((\.\d+)+)?/g,
          function ($0, integer, decimal, $3) {
            if (decimal !== $3) {
              return (
                padding.slice(integer.length) +
                integer +
                decimal
              );
            }
            decimal = (decimal || '.0');
            return (
              padding.slice(integer.length) +
              integer +
              decimal +
              padding.slice(decimal.length)
            );
          }
        );
        return value;
      }
      actions.normalizeMixedDataValue = normalizeMixedDataValue;

      function fetchDirFiles(file) {
        promisify($scope.dir.contents, 'fetch')().then(function () {
          if (file) {
            keypather.set(file, 'state.renaming', true);
          }
        }).catch(function (err) {
          // We want to filter out this message because it's unhelpful to the user, and usually this
          // only happens if the instance is (temporarily) out of sync with the database.  If this
          // error happens, it's being taken care of at a higher level up from here
          if (err.message !== 'Container not found') {
            return errs.handler(err);
          }
        });
      }
      actions.fetchDirFiles = fetchDirFiles;
      $scope.$watchCollection(function () {
        return {
          dir: $scope.dir,
          open: keypather.get($scope, 'dir.state.open')
        };
      }, function (newVal, oldVal) {
        if (newVal.open) {
          fetchDirFiles();
        }
      });
    }
  };
}
