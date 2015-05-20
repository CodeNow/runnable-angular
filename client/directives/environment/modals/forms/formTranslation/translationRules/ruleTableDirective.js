'use strict';

require('app')
  .directive('ruleTable', function ruleTable(
    createTransformRule,
    deleteTransformRule,
    keypather,
    promisify
  ) {
    return {
      restrict: 'A',
      templateUrl: 'ruleTableView',
      link: function ($scope, elem, attrs) {
        $scope.openRulePopover = function (rule) {
          $scope.popoverData.data.state = rule ? angular.copy(rule) : {};
          $scope.popoverData.data.isUpdating = !!rule;
          if ($scope.popoverData.data.isUpdating) {
            $scope.popoverData.data.state.oldRule = rule;
          }
          $scope.popoverData.active = true;
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
                .then(function () {
                  return promisify($scope.state.contextVersion, 'fetch')();
                })
                .then(function (contextVersion) {
                  var index = $scope.state.list.indexOf(rule);
                  if (~index) {
                    $scope.state.list.splice(index, 1);
                  }
                });
            },
            createRule: function (rule) {
              $scope.popoverData.active = false;
              return createTransformRule(
                keypather.get($scope.state, 'contextVersion.appCodeVersions.models[0]'),
                rule
              )
                .then(function () {
                  return promisify($scope.state.contextVersion, 'fetch')();
                })
                .then(function () {
                  $scope.list.push(rule);
                });
            },
            performCheck: function (rule, currentState) {
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
