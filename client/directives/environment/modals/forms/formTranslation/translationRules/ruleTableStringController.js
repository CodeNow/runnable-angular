'use strict';

require('app')
  .controller('RuleTableStringController', function RuleTableStringController(
    keypather,
    dockerStreamCleanser,
    $scope,
    primus,
    promisify,
    through,
    errs,
    $timeout
  ) {

    $scope.header = {
      description: 'New string rule',
      title: 'Strings'
    };
    $scope.type = 'strings';

    $scope.state = {
      list: [{
        path: 'cheese',
        newPath: 'cottage cheese'
      }]
    };

  });