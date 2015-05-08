'use strict';

require('app')
  .controller('RuleTableFileController', function RuleTableFileController(
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
      description: 'New filename rule',
      title: 'Filenames'
    };
    $scope.type = 'filenames';

    $scope.state = {
      list: [{
        path: 'config/environment',
        newPath: './client/config/environment.js'
      }, {
        path: './client/assets/js/primus-client.js',
        newPath: './client/assets/js/primus-client-prod.js'
      }]
    };

  });