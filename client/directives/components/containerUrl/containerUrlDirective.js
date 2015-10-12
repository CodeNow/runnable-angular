'use strict';

require('app')
  .directive('containerUrl', containerUrl);

var CLIPBOARD_START_MESSAGE = 'Click to copy';
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
) {
  return {
    restrict: 'A',
    templateUrl: 'containerUrlView',
    scope: {
      instance: '=',
      openItems: '='
    },
    link: function ($scope) {
      $scope.clipboardText = CLIPBOARD_START_MESSAGE;
      function getModifierKey() {
        return window.navigator.platform.toLowerCase().indexOf('mac') > -1 ? '⌘' : 'CTRL';
      }
      $scope.shouldShowCopyButton = function () {
        return UNAVAILABLE_OS_LIST.indexOf(window.navigator.platform) === -1;
      };

      $scope.onClipboardEvent = function (err, reset) {
        if (reset) {
          $scope.clipboardText = CLIPBOARD_START_MESSAGE;
        } else if (err) {
          var modifier = getModifierKey();
          $scope.clipboardText = 'Press ' + modifier + '+C ' + ' to Copy';
        } else {
          $scope.clipboardText = 'Copied!';
        }
      };
    }
  };
}
