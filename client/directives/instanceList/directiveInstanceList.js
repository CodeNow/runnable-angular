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
  regexpQuote,
  $rootScope
) {
  return {
    restrict: 'A',
    templateUrl: 'viewInstanceList',
    scope: {
      data: '=',
      state: '=',
      actions: '='
    },
    link: function ($scope) {
      $scope.filter = {
        string: '',
        instances: []
      };

      $scope.actions.preventClosingTeamMember = function (event) {
        event.stopPropagation();
        $rootScope.$broadcast('close-popovers');
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
        if (newValue && newValue.length) {

          var filterRegex = '^.*';
          newValue.split('').forEach(function(char){
            filterRegex += regexpQuote(char) + '.*';
          });
          filterRegex += '$';

          var regex = new RegExp(filterRegex);
          var instances = keypather.get($scope, 'data.instances.models') || [];
          $scope.filter.instances = instances.filter(function(instance) {
            return regex.test(instance.attrs.name);
          });

        } else {
          $scope.filter.instances = [];
        }
      });
    }
  };
}
