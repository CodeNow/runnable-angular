'use strict';

require('app')
  .directive('tabs', tabs);
/**
 * tabs Directive
 * @ngInject
 */
function tabs(
  async,
  $rootScope,
  $state,
  $stateParams,
  QueryAssist,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewTabs',
    scope: {
      openItems: '='
    },
    link: function ($scope, element, attrs) {
      $scope.state = $state;
      var actions = $scope.actions = {};
      var data = $scope.data = {};
    }
  };
}
