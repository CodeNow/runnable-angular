var app  = require('app');
// var $    = require('jquery');

app.controller('ControllerProjectHeader', ControllerProjectHeader);
function ControllerProjectHeader ($scope,
                                  $window) {
  var dataProjectHeader = $scope.dataProjectHeader = {};

  // dataHeader.togglePopover = function (popoverName, eventA) {
  //   if (dataHeader['show' + popoverName]) {
  //     eventA.stopPropagation();
  //     return;
  //   }
  //   dataHeader['show' + popoverName] = true;
  //   // prevent popover from minimizing when clicking inside popover
  //   var $elPopover = $(eventA.currentTarget).parent('li.btn').children('div.popover');
  //   $elPopover.off('click').on('click', function (eventC) {
  //     if ($(this).has($(eventC.target))) {
  //       eventC.stopPropagation();
  //     }
  //   });
  //   // setTimeout prevents callback registered below from firing for THIS click event
  //   // (we want it to fire on the next click instead)
  //   setTimeout(function () {
  //     $(window).one('click', function (eventB) {
  //       $scope.$apply(function () {
  //         dataHeader['show' + popoverName] = false;
  //       });
  //     });
  //   }, 1);
  // };
}