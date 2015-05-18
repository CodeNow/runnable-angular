'use strict';

require('app')
  .controller('RuleTableFileController', function RuleTableFileController(
    $q,
    $scope,
    $timeout,
    testRenameTransformRule
  ) {
    $scope.header = {
      description: 'New filename rule',
      title: 'Filenames'
    };
    $scope.allowedTableTypes = ['filenames'];

    $scope.state = {
      list: [{
        oldValue: 'config/environment',
        newValue: './client/config/environment.js'
      }, {
        oldValue: './client/assets/js/primus-client.js',
        newValue: './client/assets/js/primus-client-prod.js'
      }]
    };

    $scope.popoverTemplate = 'viewPopoverFilenameRule';


    $scope.performCheck = testRenameTransformRule;

  });