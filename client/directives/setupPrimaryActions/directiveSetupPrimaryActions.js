require('app')
  .directive('setupPrimaryActions', setupPrimaryActions);
/**
 * @njInject
 */
function setupPrimaryActions(
  async,
  $state,
  $stateParams
) {
  return {
    restrict: 'E',
    templateUrl: 'viewSetupPrimaryActions',
    replace: true,
    scope: {
      activeAccount: '=',
      data: '=',
      loading: '=',
      name: '=',
      isDockerFileValid: '=',
      isNameValid: '=',
      openItems: '=',
      instanceOpts: '='
    },
    link: function ($scope, elem, attrs) {

      function goToInstance() {
        $state.go('instance.instance', {
          userName: $stateParams.userName,
          instanceName: $scope.instance.attrs.name
        });
      }

      $scope.buildAndAttach = function () {
        $scope.loading = true;

        function build(cb) {
          var unwatch = $scope.$watch('openItems.isClean()', function (n) {
            if (!n) { return; }
            unwatch();
            $scope.data.build.build({
              message: 'Initial Build'
            }, cb);
          });
        }

        function attach(cb) {
          $scope.instanceOpts.owner = {
            github: $scope.activeAccount.oauthId()
          };
          $scope.instanceOpts.build = $scope.data.build.id();
          $scope.instanceOpts.name = $scope.name;
          $scope.instance = $scope.data.user.createInstance($scope.instanceOpts, cb);
        }
        async.series([
          build,
          attach
        ], function (err) {
          if (err) { throw err; }
          $scope.loading = false;
          goToInstance();
        });
      };
    }
  };
}
