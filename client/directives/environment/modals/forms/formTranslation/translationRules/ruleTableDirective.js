'use strict';

require('app')
  .directive('ruleTable', function ruleTable(
    createTransformRule,
    deleteTransformRule,
    errs,
    keypather,
    moveTransformRules
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
          moveTransformRules($scope.list, $scope.properties.action);
        };
        $scope.popoverData = {
          active: false,
          data: {
            parentData: $scope.data,
            parentState: $scope.state,
            state: {},
            getMatchDisplay: $scope.getMatchDisplay,
            instanceFilter: {
              attrs: {
                shortHash: '!' + $scope.state.server.instance.attrs.shortHash
              }
            }
          },
          actions: {
            cancel: function () {
              $scope.popoverData.active = false;
            },
            deleteRule: function (rule) {
              $scope.popoverData.active = false;
              return deleteTransformRule(
                keypather.get($scope.state, 'contextVersion.appCodeVersions.models[0]'),
                rule
              )
                .then($scope.actions.recalculateRules)
                .catch(errs.handler);
            },
            createRule: function (rule) {
              $scope.popoverData.active = false;
              $scope.tableProcessing = true;
              return createTransformRule(
                keypather.get($scope.state, 'contextVersion.appCodeVersions.models[0]'),
                rule
              )
                .then($scope.actions.recalculateRules)
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
