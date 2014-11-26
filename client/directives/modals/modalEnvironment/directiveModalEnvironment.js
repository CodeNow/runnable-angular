require('app')
  .directive('modalEnvironment', modalEnvironment);
/**
 * directive modalEnvironment
 * @ngInject
 */
function modalEnvironment(
  $localStorage,
  QueryAssist,
  $stateParams,
  $rootScope,
  keypather,
  async,
  user,
  $log
) {
  return {
    restrict: 'E',
    templateUrl: 'viewModalEnvironment',
    replace: true,
    scope: {
      data: '=',
      currentModel: '=',
      stateModel: '=',
      actions: '=',
      defaultActions: '='
    },
    link: function ($scope, element, attrs) {
      // Add thing
      $scope.validation = {};
      $scope.tempModel = {};

      $scope.pasteLinkedInstance = function (text) {
        $scope.$broadcast('eventPasteLinkedInstance', text);
      };
      $scope.data.hideGuideHelpEnvModal =
          keypather.get($localStorage, 'guides.hideGuideHelpEnvModal') || false;

      $scope.onChangeHideGuideEnv = function () {
        $scope.data.hideGuideHelpEnvModal = true;
        keypather.set($localStorage, 'guides.hideGuideHelpEnvModal', true);
      };

      // This is to fetch the list of instances for the boxes area
      function fetchUser(cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, user, cb) {
            $scope.user = user;
            cb();
          })
          .go();
      }
      function fetchInstanceList(cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchInstances', cb)
          .query({
            githubUsername: $stateParams.userName
          })
          .cacheFetch(function (instances, cached, cb) {
            if (!cached && instances.models.length === 0) {
              throw new Error('instance not found');
            }
            $scope.data.instances = instances;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, projects, cb) {
            if (err) { return $log.error(err); }
            cb();
          })
          .go();
      }
      async.series([
        fetchUser,
        fetchInstanceList
      ]);
    }
  };
}