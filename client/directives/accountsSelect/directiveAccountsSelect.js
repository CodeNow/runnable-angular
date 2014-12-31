require('app')
  .directive('accountsSelect', accountsSelect);
/**
 * This directive is in charge of displaying the active account, and modifies the activeAccount
 * on the scope, which then propigates down the parent's scope.  It doesn't fetch anything, since
 * the parent fetches both the user and their orgs.
 * @ngInject
 */
function accountsSelect (
  $state,
  $rootScope
) {
  return {
    restrict: 'E',
    templateUrl: 'viewAccountsSelect',
    replace: true,
    scope: {
      data: '='
    },
    link: function ($scope, elem, attrs) {

      // outside click, close list
      $scope.$on('app-document-click', function () {
        $scope.isChangeAccount = false;
      });

      // control collapse/expand accounts list
      $scope.isChangeAccount = false;

      $scope.selectActiveAccount = function (userOrOrg) {
        if (!$scope.isChangeAccount) { return; }
        // close list
        $scope.isChangeAccount = false;
        var username = userOrOrg.oauthName();
        //
        $scope.data.activeAccount = userOrOrg;
        $scope.data.instances = null;
        $rootScope.safeApply();
        $scope.$emit('INSTANCE_LIST_FETCH', username);
        $state.go('^.home', {
          userName: username
        });
      };
    }
  };
}
