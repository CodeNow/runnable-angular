'use strict';

require('app')
  .directive('fileRuleTable', function fileRuleTable(
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
          description: 'New filename rule',
          title: 'Filenames'
        };
        $scope.allowedTableTypes = ['filenames'];
        $scope.tableType = 'filenames';

        $scope.state = {
          list: [{
            path: 'config/environment',
            newPath: './client/config/environment.js'
          }, {
            path: './client/assets/js/primus-client.js',
            newPath: './client/assets/js/primus-client-prod.js'
          }]
        };

        $scope.popoverData = {
          data: $scope.data,
          actions: $scope.actions,
          template: 'viewPopoverFilenameRule'
        };

      }
    };
  });
