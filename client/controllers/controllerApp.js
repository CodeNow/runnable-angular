require('app')
  .controller('ControllerApp', ControllerApp);
/**
 * ControllerApp
 * @constructor
 * @export
 * @ngInject
 */
function ControllerApp (
  $rootScope,
  $scope,
  user,
  $stateParams,
  $state
) {
  this.scope = $scope;
  var self = ControllerApp;
  var dataApp = $scope.dataApp = $rootScope.dataApp = self.initState($state, $stateParams);

  dataApp.click = function () {
    self.documentLevelClick($scope);
  };

  dataApp.holdUntilAuth = function (cb) {
    self.holdUntilAuth(dataApp.user, user, $state, function (err, response, newData) {
      $scope.$apply(function () {
        angular.extend(dataApp, newData);
        cb(err, dataApp.user);
      });
    });
  };
}

ControllerApp.initState = function ($state, $stateParams) {
  return {
    state: $state,
    stateParams: $stateParams,
    user: null
  };
};

ControllerApp.documentLevelClick = function ($scope) {
  $scope.$broadcast('app-document-click');
};

ControllerApp.holdUntilAuth = function (dataAppUser, user, $state, cb) {
  var newData = {};
  newData.user = null;
  if (typeof dataAppUser === 'undefined') {
    cb(null, newData);
  } else {
    var newUser = user.fetchUser('me', function (err, result) {
      if (err) {
        $state.go('home', {});
      } else {
        newData.user = newUser;
      }
      cb(err, result, newData);
    });
  }
};
