'use strict';

require('app')
  .directive('instanceList', instanceList);
/**
 * @ngInject
 */
function instanceList(
  getInstanceClasses,
  getInstanceAltTitle,
  getTeamMemberClasses,
  $state,
  keypather,
  regexpQuote
) {
  return {
    restrict: 'A',
    templateUrl: 'viewInstanceList',
    scope: {
      data: '=',
      state: '=',
      actions: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.filterString = '';
      $scope.isFiltering = false;
      $scope.filteredInstances = [];

      $scope.stateToInstance = function (instance, $event) {
        if ($event && $event.preventDefault) {
          $event.preventDefault();
        }
        $state.go('instance.instance', {
          instanceName: instance.attrs.name,
          userName: instance.attrs.owner.username
        });
      };

      $scope.getInstanceClasses = getInstanceClasses;
      $scope.getInstanceAltTitle = getInstanceAltTitle;
      $scope.getTeamMemberClasses = getTeamMemberClasses;

      $scope.popoverInvite = {
        data: {
          getTeamName: function () {
            return $state.params.userName;
          }
        }
      };

      $scope.$watch('filterString', function(newValue){
        if (newValue && newValue.length) {
          $scope.isFiltering = true;

          var filterRegex = '^.*';
          newValue.split('').forEach(function(char){
            filterRegex += regexpQuote(char) + '.*';
          });
          filterRegex += '$';

          var regex = new RegExp(filterRegex);
          var instances = keypather.get($scope, 'data.instances.models') || [];
          $scope.filteredInstances = instances.filter(function(instance){
            return regex.test(instance.attrs.name);
          });

        } else {
          $scope.filteredInstances = [];
          $scope.isFiltering = false;
        }
      });
    }
  };
}
