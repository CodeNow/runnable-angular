var app = require('app');
app.controller('ControllerHeader', ['$scope', '$window', function ($scope, $window) {
  var dataHeader = {};
  $scope.dataHeader = dataHeader;

  dataHeader.togglePopover1 = function (e) {
    if (e) e.stopPropagation();
    if (!dataHeader.showPopover1) {
      dataHeader.showPopover1 = true;
      $window.onclick = function (event) {
        dataHeader.showPopover1 = false;
        $scope.$apply();
        $window.onclick = null;
      };
    }
  };
}]);