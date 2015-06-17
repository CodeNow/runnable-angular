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
      description: 'New Filename Rule',
      title: 'Filenames'
    };
    $scope.properties = {
      allowedTableTypes: ['rename'],
      action: 'rename'
    };
    $scope.$watchCollection(
      'state.contextVersion.getMainAppCodeVersion().attrs.transformRules.rename',
      function (n) {
        if (n) {
          $scope.list = populateRulesWithWarningsAndDiffs(n, $scope.state.transformResults);
        }
      }
    );

    $scope.popoverTemplate = 'viewPopoverFilenameRule';

    $scope.performCheck = function (state) {
      return testRenameTransformRule(
        keypather.get($scope.state, 'contextVersion.getMainAppCodeVersion()'),
        state
      )
        .then(function (nameChanges) {
          state.nameChanges = nameChanges;
        });
    };

  });