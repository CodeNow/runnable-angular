'use strict';

require('app')
  .directive('instanceHeader', instanceHeader);

var CLIPBOARD_START_MESSAGE = 'Click to copy';

/**
 * @ngInject
 */
function instanceHeader(
  $stateParams,
  $localStorage,
  extractInstancePorts,
  fetchPullRequest,
  loading
) {
  return {
    restrict: 'A',
    templateUrl: 'instanceHeaderView',
    scope: {
      instance: '=',
      openItems: '=',
      saving: '='
    },
    link: function ($scope) {
      $scope.$storage = $localStorage;
      $scope.userName = $stateParams.userName;
      $scope.isLoading = loading;
      $scope.$watch('instance', function (newValue) {
        if (!newValue) {
          return;
        }
        var ports = extractInstancePorts(newValue);
        $scope.defaultPort = '';
        if (ports.length && ports.indexOf('80') === -1) {
          $scope.defaultPort = ':' + ports[0];
        }
      });
      $scope.clipboardText = CLIPBOARD_START_MESSAGE;
      $scope.onClipboardEvent = function (err, reset) {
        if (reset) {
          $scope.clipboardText = CLIPBOARD_START_MESSAGE;
        } else if (err) {
          $scope.clipboardText = 'lolz';
        } else {
          $scope.clipboardText = 'Copied!';
        }
      };
      $scope.getClipboardStatusText = function (clipboardStatus) {
        switch ($scope.clipboardStatus) {
          case 'success':
            return 'Copied!';
          case 'failure':
            return ;
          default:
            return 'Click to copy';
        }
      };
    }
  };
}
