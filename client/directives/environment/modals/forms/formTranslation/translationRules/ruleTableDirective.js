'use strict';

require('app')
  .directive('ruleTable', function ruleTable(
    createTransformRule,
    deleteTransformRule
  ) {
    return {
      restrict: 'A',
      templateUrl: 'ruleTableView',
      link: function ($scope, elem, attrs) {
        $scope.openRulePopover = function (rule) {
          $scope.popoverData.data.state = rule || {};
          $scope.popoverData.data.isUpdating = !!rule;
          $scope.popoverData.active = true;
        };


        $scope.popoverData = {
          active: false,
          data: {
            parentData: $scope.data,
            state: {},
            getMatchDisplay: function () {
              return 'FAKE match in 1 file (1 new association)';
            }
          },
          actions: {
            cancel: function () {
              $scope.popoverData.active = false;
            },
            deleteRule: function (rule) {
              $scope.popoverData.active = false;
              return deleteTransformRule(rule)
                .then(function () {
                  var index = $scope.state.list.indexOf(rule);
                  if (~index) {
                    $scope.state.list.splice(index, 1);
                  }
                });
            },
            createRule: function (rule) {
              $scope.popoverData.active = false;
              return createTransformRule(rule)
                .then(function () {
                  $scope.state.list.push(rule);
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
