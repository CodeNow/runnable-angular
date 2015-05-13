'use strict';

require('app')
  .directive('ruleTable', function ruleTable(
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
              var index = $scope.state.list.indexOf(rule);
              if (~index) {
                $scope.state.list.splice(index, 1);
              }
              $scope.popoverData.active = false;
              $scope.deleteRule(rule);
            },
            createRule: function (rule) {
              $scope.popoverData.active = false;
              $scope.addRule(rule);
              $scope.state.list.push(rule);
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
