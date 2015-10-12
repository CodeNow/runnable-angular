'use strict';

require('app')
  .directive('instanceHeader', instanceHeader);

var CLIPBOARD_START_MESSAGE = 'Click to copy';

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
