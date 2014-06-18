var app = require('app');
var $   = require('jquery');
app.controller('ControllerBuildList', ['$scope', '$window', function ($scope, $window) {
  var dataBuildList = {};
  $scope.dataBuildList = dataBuildList;

  dataBuildList.togglePopover = function (popoverName, eventA) {
    if (dataBuildList['show' + popoverName]) {
      eventA.stopPropagation();
      return;
    }
    dataBuildList['show' + popoverName] = true;
    // prevent popover from minimizing when clicking inside popover
    var $elPopover = $(eventA.currentTarget).parent('li.btn').children('.popover');
    $elPopover.off('click').on('click', function (eventC) {
      if ($(this).has($(eventC.target))) {
        eventC.stopPropagation();
      }
    });
    // setTimeout prevents callback registered below from firing for THIS click event
    // (we want it to fire on the next click instead)
    setTimeout(function () {
      $(window).one('click', function (eventB) {
        $scope.$apply(function () {
          dataBuildList['show' + popoverName] = false;
        });
      });
    }, 1);
  };
}]);