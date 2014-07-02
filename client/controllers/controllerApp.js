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
  $state,
  apiHost
) {

  this.scope = $scope;
  var self = ControllerApp;
  var dataApp = $scope.dataApp = $rootScope.dataApp = self.initState($state,
                                                                     $stateParams,
                                                                     apiHost);

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

  $scope.$watch('dataApp.user', function (newVal, oldVal) {
  });
}

ControllerApp.initState = function ($state, $stateParams, apiHost) {
  return {
    state: $state,
    stateParams: $stateParams,
    user: null,
    loginURL: apiHost+'/auth/github?redirect='+encodeURI('http://localhost:3001'),
    logoutURL: apiHost+'/auth/logout?redirect='+encodeURI('http://localhost:3001')
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

