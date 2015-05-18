'use strict';

require('app')
  .controller('RuleTableStringController', function RuleTableStringController(
    $q,
    $scope,
    $timeout,
    testReplaceTransformRule
  ) {

    $scope.header = {
      description: 'New string rule',
      title: 'Strings'
    };
    $scope.allowedTableTypes = ['strings'];

    $scope.state = {
      list: [{
        oldValue: 'cheese',
        newValue: 'cottage cheese'
      }]
    };


    $scope.popoverTemplate = 'viewPopoverStringRule';

    $scope.performCheck = testReplaceTransformRule;

  });