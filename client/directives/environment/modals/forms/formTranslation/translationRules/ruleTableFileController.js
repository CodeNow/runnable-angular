'use strict';

require('app')
  .controller('RuleTableFileController', function RuleTableFileController(
    $q,
    $scope,
    $timeout
  ) {
    $scope.header = {
      description: 'New filename rule',
      title: 'Filenames'
    };
    $scope.allowedTableTypes = ['filenames'];

    $scope.state = {
      list: [{
        oldValue: 'config/environment',
        newValue: './client/config/environment.js'
      }, {
        oldValue: './client/assets/js/primus-client.js',
        newValue: './client/assets/js/primus-client-prod.js'
      }]
    };

    $scope.popoverTemplate = 'viewPopoverFilenameRule';


    $scope.deleteRule = function () {

    };


    $scope.addRule = function () {

    };

    $scope.performCheck = function (rule) {
      var defer = $q.defer();
      $timeout(function () {
        rule.diff = {
          path: 'build/index.html',
          newPath: 'build/index.sass'
        };
        defer.resolve();
      }, 1000);
      return defer.promise;
    };

  });