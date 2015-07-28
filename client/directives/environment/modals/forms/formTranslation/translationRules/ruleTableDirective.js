'use strict';

require('app')
  .directive('ruleTable', function ruleTable(
    createTransformRule,
    deleteTransformRule,
    errs,
    keypather,
    moveTransformRules,
    updateDockerfileFromState,
    loadingPromises
  ) {
    return {
      restrict: 'A',
      templateUrl: 'ruleTableView',
      link: function ($scope, elem, attrs) {
        $scope.openRulePopover = function (rule) {
          $scope.popoverData.data.state = rule ? angular.copy(rule) : {};
          if (rule) {
            $scope.popoverData.data.state.oldRule = rule;
          }
          $scope.popoverData.active = true;
        };
        $scope.dropRule = function (event, newIndex, rule) {
          var currentIndex = 0;
          $scope.list.find(function (listRule, index) {
            currentIndex = index;
            return listRule._id === rule._id;
          });
          if (newIndex > 0 && currentIndex <= newIndex - 1) {
            newIndex -= 1;
          }
          $scope.list.splice(currentIndex, 1);
          $scope.list.splice(newIndex, 0, rule);
          loadingPromises.add('editServerModal', moveTransformRules(
            keypather.get($scope.state, 'contextVersion.getMainAppCodeVersion()'),
            $scope.list,
            $scope.properties.action
          ));
        };

        function hasRules(acv) {
          return (keypather.get(acv, 'attrs.transformRules.rename.length') ||
              keypather.get(acv, 'attrs.transformRules.replace.length') ||
              keypather.get(acv, 'attrs.transformRules.exclude.length'));
        }

        $scope.popoverData = {
          active: false,
          data: {
            parentData: $scope.data,
            parentState: $scope.state,
            state: {},
            getMatchDisplay: $scope.getMatchDisplay,
            instanceFilter: function () {
              return {
                attrs: {
                  shortHash: '!' + $scope.state.instance.attrs.shortHash
                }
              };
            }
          },
          actions: {
            cancel: function () {
              $scope.popoverData.active = false;
            },
            deleteRule: function (rule) {
              $scope.popoverData.active = false;
              return loadingPromises.add('editServerModal', deleteTransformRule(
                keypather.get($scope.state, 'contextVersion.getMainAppCodeVersion()'),
                rule
              )
                .then(function () {
                  // Update the dockerfile if no rules exist after deleting one
                  if (!hasRules(keypather.get($scope.state, 'contextVersion.getMainAppCodeVersion()'))) {
                    return updateDockerfileFromState($scope.state);
                  }
                })
                .then($scope.actions.recalculateRules))
                .catch(errs.handler);
            },
            createRule: function (rule) {
              $scope.popoverData.active = false;
              $scope.tableProcessing = true;
              var mainAcv = keypather.get($scope.state, 'contextVersion.getMainAppCodeVersion()');
              // Update the dockerfile if no rules exist before creating one
              var shouldUpdateDockerfile = !hasRules(mainAcv);

              return loadingPromises.add('editServerModal', createTransformRule(mainAcv, rule)
                .then(function () {
                  if (shouldUpdateDockerfile) {
                    return updateDockerfileFromState($scope.state);
                  }
                })
                .then($scope.actions.recalculateRules))
                .catch(errs.handler)
                .finally(function () {
                  $scope.tableProcessing = false;
                });
            },
            performCheck: function (rule, currentState) {
              if (angular.equals(rule, {})) { return; }
              currentState.processing = true;

              $scope.performCheck(rule)
                .then(function () {
                  currentState.searched = true;
                })
                .catch(errs.handler)
                .finally(function () {
                  currentState.processing = false;
                });
            }
          }
        };
      }
    };
  });
