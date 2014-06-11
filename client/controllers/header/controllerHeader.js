var app = require('app');
app.controller('ControllerHeader', ['$scope', '$window', function ($scope, $window) {
  var dataHeader = {};
  $scope.dataHeader = dataHeader;

  dataHeader.toggleChangeProjectPopover = function (e) {
    if (e) e.stopPropagation();
    dataHeader.showChangeProject = !dataHeader.showChangeProject;
    if (dataHeader.showChangeProject) {
      $window.onclick = function (event) {
        dataHeader.showChangeProject = false;
        $scope.$apply();
        $window.onclick = null;
      };
    }
  };
}]);