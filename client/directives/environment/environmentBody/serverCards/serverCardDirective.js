'use strict';

require('app')
  .directive('serverCard', function serverCard(
    $document,
    $q,
    $rootScope,
    $state,
    errs,
    createServerObjectFromInstance,
    fetchDockerfileForContextVersion,
    fetchStackAnalysis,
    keypather,
    ModalService,
    parseDockerfileForCardInfoFromInstance,
    promisify,
    currentOrg
  ) {
    return {
      restrict: 'A',
      templateUrl: 'serverCardView',
      scope: {
        data: '=',
        actions: '=',
        instance: '='
      },
      link: function ($scope, ele) {
        var listeners = [];

        $scope.openEditServerModal = function (defaultTab) {
          ModalService.showModal({
            controller: 'EditServerModalController',
            controllerAs: 'SMC',
            templateUrl: 'editServerModalView',
            inputs: {
              tab: defaultTab,
              instance: $scope.instance
            }
          })
            .catch(errs.handler);
        };

        $scope.getContainerFilesDisplay = function () {
          var repos = 0;
          var files = 0;
          var keys = 0;
          $scope.server.containerFiles = $scope.server.containerFiles || [];
          $scope.server.containerFiles.forEach(function (containerFile) {
            if (containerFile.type === 'Repository') {
              repos += 1;
            } else if (containerFile.type === 'File') {
              files += 1;
            } else if (containerFile.type === 'SSH Key') {
              keys += 1;
            }
          });
          var messages = [];
          if (repos === 1) {
            messages.push('1 Repository');
          } else if (repos) {
            messages.push(repos + ' Repositories');
          }
          if (files === 1) {
            messages.push('1 File');
          } else if (files) {
            messages.push(files + ' Files');
          }
          if (keys === 1) {
            messages.push('1 Key');
          } else if (keys) {
            messages.push(keys + ' Keys');
          }

          if (messages.length) {
            return messages.join(', ');
          }
          return '—';

        };
        $scope.server = {};
        $scope.activeAccount = currentOrg.github; // I'm unsure if this is used.

        function handleNewInstanceUpdate (instance) {
          // This may be a newInstance... just a placeholder
          angular.extend($scope.server, createServerObjectFromInstance(instance));

          if (!instance.contextVersion) { return; }
          $scope.server.building = true;

          // Update Dockerfile
          if (instance.hasDockerfileMirroring() && instance.mirroredDockerfile === undefined) {
            fetchDockerfileForContextVersion(instance.contextVersion)
              .then(function (dockerfile) {
                instance.mirroredDockerfile = dockerfile;
              });
          }

          $scope.server.building = false;
        }

        $scope.$watchCollection('instance.attrs', function (n) {
          if (n) {
            handleNewInstanceUpdate($scope.instance);
          }
        });

        $scope.$watch('instance.contextVersion.attrs.infraCodeVersion', function (n) {
          if (n && !keypather.get($scope, 'instance.contextVersion.attrs.advanced')) {
            $scope.server.parsing = true;
            return parseDockerfileForCardInfoFromInstance($scope.instance)
              .then(function (data) {
                if (data) {
                  Object.keys(data).forEach(function (key) {
                    $scope.server[key] = data[key];
                  });
                }
              })
              .catch(errs.handler)
              .finally(function () {
                $scope.server.parsing = false;
              });
          }
        });

        $scope.getFlattenedSelectedStacks = function (selectedStack) {
          if (selectedStack) {
            var flattened = selectedStack.name + ' ' + selectedStack.selectedVersion;
            if (selectedStack.dependencies) {
              selectedStack.dependencies.forEach(function (dep) {
                flattened += ', ' + $scope.getFlattenedSelectedStacks(dep);
              });
            }
            return flattened;
          }
          return '—';
        };
        $scope.showSpinner = function () {
          return !$scope.server.build || $scope.server.building || $scope.server.parsing;
        };
        $scope.getTranslationDisplay = function () {
          var ruleObject = keypather.get(
            $scope,
            'server.contextVersion.getMainAppCodeVersion().attrs.transformRules'
          );
          var total = 0;
          if (ruleObject) {
            total = ruleObject.replace.length + ruleObject.rename.length;
          }
          var result = (!total ? '—' : total + ' rule') + (total > 1 ? 's' : '');
          if (keypather.get(ruleObject, 'exclude.length')) {
            result += ' (' + ruleObject.exclude.length + ' files ignored)';
          }
          return result;
        };

        $scope.$on('$destroy', function () {
          listeners.forEach(function (watcher) {
            watcher.obj.removeListener(watcher.key, watcher.value);
          });
        });
      }
    };
  });
