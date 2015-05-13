'use strict';

require('app')
  .controller('RuleTableStringController', function RuleTableStringController(
    $q,
    $scope,
    $timeout
  ) {

    $scope.header = {
      description: 'New string rule',
      title: 'Strings'
    };
    $scope.allowedTableTypes = ['strings'];

    $scope.state = {
      list: [{
        oldValue: 'cheese',
        newValue: 'cottage cheese'
      }]
    };


    $scope.popoverTemplate = 'viewPopoverStringRule';


    $scope.deleteRule = function () {

    };


    $scope.addRule = function () {

    };

    $scope.performCheck = function (rule) {
      var defer = $q.defer();
      $timeout(function () {
        rule.diff = {
          path: 'build/index.html',
          changes: [{
            deletions: [{
              lineNumber: 1,
              value: '- userName: username'
            }],
            additions: [{
              lineNumber: 1,
              value: '+ userName: account.oauthName()'
            }]
          }, {
            deletions: [{
              lineNumber: 5123,
              value: '- userName: username'
            }],
            additions: [{
              lineNumber: 5123,
              value: '+ userName: account.oauthName()'
            }]
          }]
        };
        defer.resolve();
      }, 1000);
      return defer.promise;
    };

  });