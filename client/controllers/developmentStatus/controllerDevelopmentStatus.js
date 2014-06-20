var app = require('app');
app.controller('ControllerDevelopmentStatus', [
  '$scope',
  '$http',
  function ($scope,
            $http) {

  var dataDevelopmentStatus = $scope.dataDevelopmentStatus = {};

  var dataDevelopmentStatus = {};
  $scope.dataDevelopmentStatus = dataDevelopmentStatus;

  dataDevelopmentStatus.hover = function () {
  };
  dataDevelopmentStatus.update = function () {
    $http({
      method: 'GET',
      url: '/development_status'
    })
    .success(function (data, status, headers, config) {
      dataDevelopmentStatus.repository = data;
      dataDevelopmentStatus.repository.statusShort = dataDevelopmentStatus.repository.status.split('\n')[0] + '\n'
                                             + dataDevelopmentStatus.repository.status.split('\n')[1];
      dataDevelopmentStatus.repository.logShort = dataDevelopmentStatus.repository.log.split('\n')[0] + '\n'
                                          + dataDevelopmentStatus.repository.log.split('\n')[1];

    })
    .error();
  };
  dataDevelopmentStatus.update();
  setInterval(dataDevelopmentStatus.update, 1000);

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
  dataDevelopmentStatus.style = defaultStyle;
  dataDevelopmentStatus.setPosition = function (position) {
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