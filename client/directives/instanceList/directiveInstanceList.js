require('app')
  .directive('instanceList', instanceList);
/**
 * This directive is in charge of fetching and displaying the instance list for the entire page.
 * The parent gives this the 'instances' pointer, which it populates whenever it see's a change of
 * the active account
 * @ngInject
 */
function instanceList (
  async,
  determineActiveAccount,
  getInstanceClasses,
  getInstanceAltTitle,
  QueryAssist,
  fetchUser,
  $rootScope,
  $state,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewInstanceList',
    replace: true,
    scope: {
      data: '=',
      state: '='
    },
    link: function ($scope, elem, attrs) {
      // The sidebar should only update if the given instance list changes, which can happen in two
      // ways.  The activeAccount changed and we fetched them, or the collection changed in the
      // api-client because an instance was modified/created/removed.  Because of how the api-client

      $scope.stateToInstance = function (instance) {
        $state.go('instance.instance', {
          instanceName: instance.attrs.name,
          userName: instance.attrs.owner.username
        });
      };

      $scope.getInstanceClasses = getInstanceClasses;

      $scope.getInstanceAltTitle = getInstanceAltTitle;
    }
  };
}
