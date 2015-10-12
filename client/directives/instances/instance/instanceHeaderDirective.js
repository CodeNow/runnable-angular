'use strict';

require('app')
  .directive('instanceHeader', instanceHeader);

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
function instanceHeader(
  $localStorage,
  $stateParams,
  $rootScope,
  extractInstancePorts,
  fetchPullRequest
) {
  return {
    restrict: 'A',
    templateUrl: function () {
      if ($rootScope.featureFlags.newNavigation) {
        return 'instanceHeaderView';
      }
      return 'viewInstancePrimaryActions';
    },
    scope: {
      instance: '=',
      openItems: '='
    },
    link: function ($scope) {
      $scope.$storage = $localStorage;
      $scope.userName = $stateParams.userName;
      $scope.$watch('instance', function (newValue) {
        if (!newValue) {
          return;
        }
        var ports = extractInstancePorts(newValue);
        $scope.defaultPort = '';
        if (ports.length && ports.indexOf('80') === -1) {
          $scope.defaultPort = ':' + ports[0];
        }
        fetchPullRequest($scope.instance)
          .then(function (pr) {
            if (pr) {
              $scope.pr = pr;
            }
          });
      });
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
          $scope.clipboardText = 'Copy not supported, press ' + modifier + '+C ' + modifier + '+V';
        } else {
          $scope.clipboardText = 'Copied!';
        }
      };
    }
  };
}
