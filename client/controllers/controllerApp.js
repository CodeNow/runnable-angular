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
  var dataApp = $scope.dataApp = $rootScope.dataApp = self.initState($stateParams);

  dataApp.click = function () {
    $scope.$broadcast('app-document-click');
    //self.documentLevelClick($scope);
  };

  dataApp.holdUntilAuth = function (cb) {
    self.holdUntilAuth(dataApp.status, user, $state, function (err, newData, response) {
      $scope.apply(function () {
        angular.extend(dataApp, newData);
      });
      cb(err, response);
    });
  };
}

ControllerApp.initState = function ($state, $stateParams) {
  return {
    state: $state,
    stateParams: $stateParams,
    status: 'unknown',
    user: {}
  };
};

ControllerApp.documentLevelClick = function ($scope) {
  $scope.$broadcast('app-document-click');
};

ControllerApp.holdUntilAuth = function (status, user, $state, cb) {
  var resp = {};
  if (status === 'authenticated') {
    cb(null, user);
  } else if (status === 'unknown') {
    resp.user = user.fetch('me', function (err, result) {
      if (err) {
        // $state.go('home', {});
      } else {
        resp.status = 'authenticated';
      }
      cb(err, resp, result);
    });
  } else {
    throw new Error('invalid argument');
  }
};
