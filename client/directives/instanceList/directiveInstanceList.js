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
      $scope.filter = {
        string: '',
        instances: []
      };

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

      $scope.$watch('filter.string', function(newValue) {
        console.log(newValue);
        if (newValue && newValue.length) {

          var filterRegex = '^.*';
          newValue.split('').forEach(function(char){
            filterRegex += regexpQuote(char) + '.*';
          });
          filterRegex += '$';
          console.log(filterRegex);

          var regex = new RegExp(filterRegex);
          var instances = keypather.get($scope, 'data.instances.models') || [];
          $scope.filter.instances = instances.filter(function(instance) {
            console.log(instance.attrs.name);
            return regex.test(instance.attrs.name);
          });

        } else {
          $scope.filter.instances = [];
        }
      });
    }
  };
}
