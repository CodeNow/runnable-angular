'use strict';

require('app')
  .directive('intercomLink', intercomLink);

/**
 * @ngInject
 */
function intercomLink(
) {
  return {
    restrict: 'AE',
    templateUrl: 'intercomLinkView',
    scope: {
      introMessage: '@'
    },
    link: function ($scope) {
      $scope.introMessage = $scope.introMessage || 'This thing is not working propertly.';
      $scope.openIntercom = function () {
        window.Intercom(
          'showNewMessage',
          'Fudge! ' + $scope.introMessage + ' Can you fix it?'
        );
      };
    }
  };
}
