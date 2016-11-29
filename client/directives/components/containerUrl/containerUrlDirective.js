'use strict';

require('app')
  .directive('containerUrl', containerUrl);

var UNAVAILABLE_OS_LIST = [
  'Android',
  'Linux armv7l',
  'iPhone',
  'iPod',
  'iPad'
];
/**
 * @ngInject
 */
function containerUrl(
  $window,
  defaultContainerUrl
) {
  return {
    restrict: 'A',
    templateUrl: 'containerUrlView',
    scope: {
      instance: '='
    },
    link: function ($scope) {
      $scope.getContainerUrl = defaultContainerUrl;
      function getModifierKey() {
        return $window.navigator.platform.toLowerCase().indexOf('mac') > -1 ? '⌘' : 'CTRL';
      }
      $scope.shouldShowCopyButton = !UNAVAILABLE_OS_LIST.includes($window.navigator.platform);

      $scope.dismissUrlCallout = function () {
        console.log('dismissUrlCallout');
        $scope.$emit('dismissUrlCallout');
      };

      $scope.onClipboardEvent = function (err) {
        if (err) {
          var modifier = getModifierKey();
          $scope.clipboardText = modifier + '+C ' + ' to Copy';
        } else {
          $scope.clipboardText = 'Copied!';
        }
      };
    }
  };
}
