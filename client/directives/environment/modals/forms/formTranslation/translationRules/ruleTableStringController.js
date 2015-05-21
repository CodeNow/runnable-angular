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

    $scope.$watch('state.contextVersion.appCodeVersions.models[0]', function (n) {
      if (n) {
        $scope.list = n.attrs.transformRules.replace;
      }
    });


    $scope.popoverTemplate = 'viewPopoverStringRule';

    $scope.performCheck = function (state) {
      state.action = 'replace';
      return testReplaceTransformRule(
        keypather.get($scope.state, 'contextVersion.appCodeVersions.models[0]'),
        state
      )
        .then(function (diff) {
          state.diff = diff;
        });
    };

  });