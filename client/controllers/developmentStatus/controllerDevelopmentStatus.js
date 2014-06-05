var app = require('app');
app.controller('ControllerDevelopmentStatus', [
  '$scope',
  '$http', function ($scope, $http) {

  var DevStatusData = {};
  $scope.DevStatusData = DevStatusData;

  DevStatusData.hover = function () {
  };
  DevStatusData.update = function () {
    $http({
      method: 'GET',
      url: '/development_status'
    })
    .success(function (data, status, headers, config) {
      DevStatusData.repository = data;
      DevStatusData.repository.statusShort = DevStatusData.repository.status.split('\n')[0] + '\n'
                                             + DevStatusData.repository.status.split('\n')[1];
      DevStatusData.repository.logShort = DevStatusData.repository.log.split('\n')[0] + '\n'
                                          + DevStatusData.repository.log.split('\n')[1];

    })
    .error();
  };
  DevStatusData.update();
  setInterval(DevStatusData.update, 1000);

  var defaultStyle = {
    color: '#FFF',
    position: 'absolute',
    bottom: '0px',
    right: '0px',
    border: '1px solid #000',
    'min-width': '200px',
    'max-width': '50%',
    'max-height': '75%',
    'overflow': 'hidden',
    background: 'rgba(91, 55, 119, 0.7)'
  };
  DevStatusData.style = defaultStyle;

}]);