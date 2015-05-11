'use strict';

require('app')
  .directive('stringRuleTable', function stringRuleTable(
  ) {
    return {
      restrict: 'A',
      templateUrl: 'ruleTableView',
      scope: {
        actions: '=',
        data: '='
      },
      link: function ($scope, elem, attrs) {
        $scope.header = {
          description: 'New string rule',
          title: 'Strings'
        };
        $scope.allowedTableTypes = ['strings'];
        $scope.tableType = 'strings';

        $scope.state = {
          list: [{
            path: 'cheese',
            newPath: 'cottage cheese'
          }]
        };


        $scope.popoverData = {
          data: $scope.data,
          actions: $scope.actions,
          template: 'viewPopoverStringRule'
        };
      }
    };
  });
