'use strict';

require('app')
  .directive('translationRules', function translationRules(
    $timeout
  ) {
    return {
      restrict: 'A',
      templateUrl: 'viewFormTranslation',
      link: function ($scope, elem, attrs) {
        $scope.fileDiffs = [{
          path: 'build/index.html',
          newPath: 'build/index.sass',
          type: 'filenames'
        }, {
          path: 'build/dddv.html',
          type: 'strings',
          originalString: 'hello',
          newString: 'good bye',
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
          type: 'strings',
          originalString: 'karma',
          newString: 'bugatti',
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
