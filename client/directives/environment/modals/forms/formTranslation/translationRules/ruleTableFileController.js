'use strict';

require('app')
  .controller('RuleTableFileController', function RuleTableFileController(
    $q,
    $scope,
    $timeout,
    keypather,
    testRenameTransformRule
  ) {
    $scope.header = {
      description: 'New filename rule',
      title: 'Filenames'
    };
    $scope.allowedTableTypes = ['filenames'];

    $scope.tableType = 'filenames';

    $scope.$watch('state.contextVersion.appCodeVersions.models[0]', function (n) {
      if (n) {
        $scope.list = n.attrs.transformRules.rename;
      }
    });

    $scope.popoverTemplate = 'viewPopoverFilenameRule';

    $scope.performCheck = function (state) {
      return testRenameTransformRule(
        keypather.get($scope.state, 'contextVersion.appCodeVersions.models[0]'),
        state
      )
        .then(function (results) {
          state.results = results;
        });
    };

  });