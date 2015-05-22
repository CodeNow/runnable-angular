'use strict';

require('app')
  .controller('RuleTableStringController', function RuleTableStringController(
    $q,
    $scope,
    $timeout,
    keypather,
    populateRulesWithWarnings,
    testReplaceTransformRule
  ) {

    $scope.header = {
      description: 'New string rule',
      title: 'Strings'
    };
    $scope.properties = {
      allowedTableTypes: ['replace'],
      action: 'replace'
    };

    $scope.$watchCollection(
      'state.contextVersion.appCodeVersions.models[0].attrs.transformRules.replace',
      function (n) {
        if (n) {
          $scope.list = populateRulesWithWarnings(n, $scope.state.transformResults);
        }
      }
    );

    $scope.getMatchDisplay = function (rule) {
      var totalMatches = rule.diffs.reduce(function (total, diff) {
        return total + diff.changes.length;
      }, 0);
      return (!totalMatches) ?
          'No matches found' :
          totalMatches + ' matches in ' + rule.diffs.length + ' files';
    };

    $scope.popoverTemplate = 'viewPopoverStringRule';

    $scope.performCheck = function (state) {
      state.action = 'replace';
      return testReplaceTransformRule(
        keypather.get($scope.state, 'contextVersion.appCodeVersions.models[0]'),
        state
      )
        .then(function (diff) {
          state.diffs = diff;
        });
    };

  });