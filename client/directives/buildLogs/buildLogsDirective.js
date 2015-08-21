'use strict';

require('app').directive('buildLogs', buildLogs);
function buildLogs(
  $timeout,
  debounce
) {
  return {
    restrict: 'A',
    templateUrl: 'buildLogsView',
    controller: 'BuildLogsController as BLC',
    bindToController: true,
    scope: {
      instance: '='
    },
    link: function ($scope, element) {

      var scrollHelper = debounce(function () {
        var currentScroll = element[0].scrollTop;

        var children = element.children();
        var foundChild = null;
        var titleHeight = 0;
        if (children[0]) {
          console.log(angular.element(children[0]).children());
          titleHeight = angular.element(children[0]).children()[0].offsetHeight;
        }
        console.log(titleHeight);



        for(var i=0;i<children.length;i++){
          var child = children[i];
          if (currentScroll >= child.offsetTop) {
            foundChild = i;
          } else {
            break;
          }
        }

        $scope.BLC.buildLogs.forEach(function (command) {
          command.fixed = false;
          command.absolute = false;
        });


        var foundCommand = $scope.BLC.buildLogs[foundChild];
        // If the command is found AND the fixed height hasn't scrolled past its containing element
        if (foundCommand) {
          foundCommand.fixed = true;
          if (currentScroll >= children[foundChild].offsetTop + children[foundChild].offsetHeight - titleHeight - 3) {
            foundCommand.fixed = false;
            foundCommand.absolute = true;
          }
        }

        $scope.$applyAsync();

      }, 20);

      $scope.$watch('BLC.buildLogs', function () {
        scrollHelper();
      });

      element.on('scroll', function () {
        scrollHelper();
      });


      $scope.actions = {
        toggleCommand: function (event, command) {
          var commandContainer = angular.element(event.currentTarget).next();
          if (command.expanded) {
            commandContainer.css('height', commandContainer[0].offsetHeight + 'px');
            $timeout(function () {
              commandContainer.css('height', 0);
            });
          } else {
            commandContainer.css('height', null);
          }

          command.expanded = !command.expanded;

        }
      };
    }
  };
}