'use strict';

require('app')
  .directive('ruleTable', function ruleTable(
    createTransformRule,
    deleteTransformRule,
    keypather,
    moveTransformRules,
    promisify
  ) {
    return {
      restrict: 'A',
      templateUrl: 'ruleTableView',
      link: function ($scope, elem, attrs) {
        $scope.openRulePopover = function (rule) {
          $scope.popoverData.data.state = rule ? angular.copy(rule) : {};
          $scope.popoverData.active = true;
        };

        $scope.moveRule = function () {
          moveTransformRules($scope.list, $scope.properties.action);
        };
        $scope.popoverData = {
          active: false,
          data: {
            parentData: $scope.data,
            state: {},
            getMatchDisplay: $scope.getMatchDisplay
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
                .then($scope.actions.recalculateRules);
            },
            createRule: function (rule) {
              $scope.popoverData.active = false;
              return createTransformRule(
                keypather.get($scope.state, 'contextVersion.appCodeVersions.models[0]'),
                rule
              )
                .then($scope.actions.recalculateRules);
            },
            performCheck: function (rule, currentState) {
              if (angular.equals(rule, {})) { return; }
              currentState.processing = true;

              $scope.performCheck(rule)
                .then(function () {
                  currentState.searched = true;
                  currentState.processing = false;
                });
            }
          }
        };
      }
    };
  });
