'use strict';

require('app')
  .directive('ruleTable', function ruleTable(
    createTransformRule,
    deleteTransformRule,
    errs,
    keypather,
    moveTransformRules,
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

        $scope.moveRule = function () {
          return loadingPromises.add('editServerModal', moveTransformRules(
            keypather.get($scope.state, 'contextVersion.getMainAppCodeVersion()'),
            $scope.list,
            $scope.properties.action
          ));
        };
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
                  shortHash: '!' + $scope.state.server.instance.attrs.shortHash
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
                .then($scope.actions.recalculateRules))
                .catch(errs.handler);
            },
            createRule: function (rule) {
              $scope.popoverData.active = false;
              $scope.tableProcessing = true;

              return loadingPromises.add('editServerModal', createTransformRule(
                keypather.get($scope.state, 'contextVersion.getMainAppCodeVersion()'),
                rule
              )
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
