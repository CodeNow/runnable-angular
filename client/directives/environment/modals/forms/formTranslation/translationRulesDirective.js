'use strict';

require('app')
  .directive('translationRules', function translationRules(
  ) {
    return {
      restrict: 'A',
      templateUrl: 'viewFormTranslation',
      link: function ($scope, elem, attrs) {
        $scope.fileDiffs = [{
          path: 'build/index.html',
          newPath: 'build/index.sass'
        }, {
          path: 'build/dddv.html',
          association: 'associatedContainer',
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
        }, {
          path: 'build/aaaa.html',
          changes: [{
            deletions: [{
              lineNumber: 1,
              value: '- userName: username'
            }, {
              lineNumber: 2,
              value: '- more: username'
            }],
            additions: [{
              lineNumber: 1,
              value: '+ userName: account.oauthName()'
            }]
          }]
        }];
      }
    };
  });
