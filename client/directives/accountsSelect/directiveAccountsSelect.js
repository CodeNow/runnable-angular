require('app')
  .directive('runnableAccountsSelect', RunnableAccountsSelect);
/**
 * @ngInject
 */
function RunnableAccountsSelect (
  $rootScope,
  $state,
  user,
  async
) {
  return {
    restrict: 'E',
    templateUrl: 'viewAccountsSelect',
    replace: true,
    scope: {
      activeAccount: '='
    },
    link: function ($scope, elem, attrs) {
      async.series([
      ]);

      $scope.showChangeAccount = false;

    }
  };
}
