var app = require('app');
var _   = require('underscore');

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
    position: 'fixed',
    bottom: '0px',
    right: '0px',
    border: '1px solid #000',
    'min-width': '200px',
    'max-width': '75%',
    'max-height': '75%',
    'overflow-y': 'scroll',
    background: 'rgba(91, 55, 119, 1)',
    'z-index': 10000,
    'cursor': 'pointer'
  };
  DevStatusData.style = defaultStyle;
  DevStatusData.setPosition = function (position) {
    switch(position){
      case 'top-left':
        defaultStyle.top  = '0px';
        defaultStyle.left = '0px';
        delete defaultStyle.bottom;
        delete defaultStyle.right;
        break;
      case 'bottom-left':
        defaultStyle.bottom  = '0px';
        defaultStyle.left = '0px';
        delete defaultStyle.top;
        delete defaultStyle.right;
        break;
      case 'bottom-right':
        defaultStyle.bottom  = '0px';
        defaultStyle.right = '0px';
        delete defaultStyle.top;
        delete defaultStyle.left;
        break;
      case 'top-right':
        defaultStyle.top  = '0px';
        defaultStyle.right = '0px';
        delete defaultStyle.bottom;
        delete defaultStyle.left;
        break;
    }
  };


}]);