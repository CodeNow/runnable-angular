'use strict';

require('app')
  .controller('RuleTableFileController', function RuleTableFileController(
    $q,
    $scope,
    $timeout,
    keypather,
    populateRulesWithWarningsAndDiffs,
    testRenameTransformRule
  ) {
    $scope.header = {
      description: 'New filename rule',
      title: 'Filenames'
    };
    $scope.properties = {
      allowedTableTypes: ['rename'],
      action: 'rename'
    };
    $scope.$watchCollection(
      'state.contextVersion.appCodeVersions.models[0].attrs.transformRules.rename',
      function (n) {
        if (n) {
          $scope.list = populateRulesWithWarningsAndDiffs(n, $scope.state.transformResults);
        }
      }
    );

    $scope.popoverTemplate = 'viewPopoverFilenameRule';

    $scope.performCheck = function (state) {
      return testRenameTransformRule(
        keypather.get($scope.state, 'contextVersion.appCodeVersions.models[0]'),
        state
      )
        .then(function (nameChanges) {
          state.nameChanges = nameChanges;
        });
    };

  });