var app  = require('app');
app.controller('ControllerApp', ControllerApp);
/**
 * ControllerApp
 * @constructor
 * @export
 * @ngInject
 */
function ControllerApp ($rootScope,
                        $scope,
                        user,
                        $stateParams,
                        $state) {

  window.user = user;

  var dataApp = $scope.dataApp = $rootScope.dataApp = {};
  dataApp.state = $state;
  dataApp.stateParams = $stateParams;
  dataApp.click = function () {
    $scope.$broadcast('app-document-click');
  };

  dataApp.status = 'unknown';
  dataApp.user   = {};

  // helper to hold api requests until auth check
  dataApp.holdUntilAuth = function (cb) {
    if (dataApp.status === 'authenticated') {
      cb(null, dataApp.user);
    } else if (dataApp.status === 'unknown') {
      dataApp.user = user.fetch('me', function (err, result) {
        if (err) {
          //$state.go('home', {});
        } else {
          dataApp.status = 'authenticated';
        }
        cb(err, result);
      });
    }
  };
}
