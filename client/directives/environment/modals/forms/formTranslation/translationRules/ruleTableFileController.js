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

    $scope.list = [{
      oldValue: 'config/environment',
      newValue: './client/config/environment.js'
    }, {
      oldValue: './client/assets/js/primus-client.js',
      newValue: './client/assets/js/primus-client-prod.js'
    }];

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