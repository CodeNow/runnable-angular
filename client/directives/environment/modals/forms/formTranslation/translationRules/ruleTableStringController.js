'use strict';

require('app')
  .controller('RuleTableStringController', function RuleTableStringController(
    $q,
    $scope,
    $timeout,
    keypather,
    testReplaceTransformRule
  ) {

    $scope.header = {
      description: 'New string rule',
      title: 'Strings'
    };
    $scope.allowedTableTypes = ['strings'];
    $scope.tableType = 'strings';

    $scope.list = [{
      oldValue: 'cheese',
      newValue: 'cottage cheese'
    }];


    $scope.popoverTemplate = 'viewPopoverStringRule';

    $scope.performCheck = function (state) {
      return testReplaceTransformRule(
        keypather.get($scope.state, 'contextVersion.appCodeVersions.models[0]'),
        state
      )
        .then(function (diff) {
          state.diff = diff;
        });
    };

  });