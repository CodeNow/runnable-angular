'use strict';

require('app')
  .controller('RuleTableStringController', function RuleTableStringController(
    $q,
    $scope,
    $timeout,
    keypather,
    populateRulesWithWarningsAndDiffs,
    testReplaceTransformRule
  ) {

    $scope.header = {
      description: 'New String Rule',
      title: 'Strings'
    };
    $scope.emptyText = {
      description: 'Replace strings in your code by creating a rule.'
    };
    $scope.properties = {
      allowedTableTypes: ['replace'],
      action: 'replace'
    };

    $scope.$watchCollection(
      'state.contextVersion.getMainAppCodeVersion().attrs.transformRules.replace',
      function (n) {
        if (n) {
          $scope.list = populateRulesWithWarningsAndDiffs(n, $scope.state.transformResults);
        }
      }
    );

    $scope.getMatchDisplay = function (rule) {
      var totalMatches = null;
      if (rule.diffs) {
        totalMatches = rule.diffs.reduce(function (total, diff) {
          return total + diff.changes.length;
        }, 0);
      }
      return (!totalMatches) ?
          'No matches found' :
          totalMatches + ' matches in ' + rule.diffs.length + ' files';
    };

    $scope.popoverTemplate = 'viewPopoverStringRule';

    $scope.performCheck = function (state) {
      return testReplaceTransformRule(
        keypather.get($scope.state, 'contextVersion.getMainAppCodeVersion()'),
        state
      )
        .then(function (diff) {
          state.diffs = diff;
        });
    };

  });
