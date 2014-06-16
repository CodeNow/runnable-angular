var app = require('app');
var $   = require('jquery');
app.controller('ControllerHeader', ['$scope', '$window', function ($scope, $window) {
  var dataHeader = {};
  $scope.dataHeader = dataHeader;

  dataHeader.togglePopover = function (popoverName, eventA) {
    var $elParent = $(eventA.currentTarget).parent('li.btn').children('div.popover');
    if (dataHeader['show' + popoverName]) {
      eventA.stopPropagation();
      return;
    }
    dataHeader['show' + popoverName] = true;
    $elParent.off('click').on('click', function (eventC) {
      if ($(this).has($(eventC.target))) {
        eventC.stopPropagation();
      }
    });
    setTimeout(function () {
      $(window).one('click', function (eventB) {
        $scope.$apply(function () {
          dataHeader['show' + popoverName] = false;
        });
      });
    }, 1);
  };
}]);