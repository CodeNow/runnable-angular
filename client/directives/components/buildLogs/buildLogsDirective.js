'use strict';

require('app').directive('buildLogs', buildLogs);
function buildLogs(
  $rootScope,
  $timeout,
  debounce
) {
  return {
    restrict: 'A',
    templateUrl: 'buildLogsView',
    controller: 'BuildLogsController as BLC',
    bindToController: true,
    scope: {
      instance: '=',
      debugContainer: '='
    },
    link: function ($scope, element) {
      var atBottom = true;
      var lockThreshold = 30;

      var scrollHelper = debounce(function (manual) {
        if (!element[0]) {
          return;
        }
        var currentScroll = element[0].scrollTop;
        var maxScroll = element[0].scrollHeight - element[0].offsetHeight;

        if (manual) {
          atBottom = maxScroll < currentScroll + lockThreshold;
        } else if (atBottom) {
          element[0].scrollTop = 100000000;
          currentScroll = element[0].scrollTop;
        }

        var children = element.children();
        var foundChild = null;
        var titleHeight = 0;
        if (children[0] && angular.element(children[0]).children()[0]) {
          titleHeight = angular.element(children[0]).children()[0].offsetHeight;
        }

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


        var foundCommand = $scope.BLC.buildLogs[foundChild - 1];
        // If the command is found AND the fixed height hasn't scrolled past its containing element
        if (foundCommand) {
          foundCommand.fixed = true;
          if (currentScroll >= children[foundChild].offsetTop + children[foundChild].offsetHeight - titleHeight - 3) {
            foundCommand.fixed = false;
            foundCommand.absolute = true;
          }
        }
        $scope.$applyAsync();
      }, 10);

      var unbindContentWatch = angular.noop;
      $scope.$watch('BLC.buildLogs.length', function () {
        scrollHelper();
        if ($scope.BLC.buildLogs.length) {
          unbindContentWatch();
          unbindContentWatch = $scope.$watch('BLC.buildLogs[' + ($scope.BLC.buildLogs.length-1) + '].content.length', function () {
            scrollHelper();
            $timeout(scrollHelper, 100);
          });
        }
      });

      element.on('scroll', function () {
        scrollHelper(true);
      });

      $scope.actions = {
        toggleCommand: function (event, command) {
          if ($scope.BLC.buildLogs.indexOf(command) === ($scope.BLC.buildLogs.length - 1) && $scope.BLC.buildLogsRunning) {
            return;
          }
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

      $scope.calculateHeaderStyle = function (command) {
        if (!element[0] || !(command.expanded && command.fixed)) {
           return;
        }

        var style = window.getComputedStyle( element[0], null);
        var eleWidth = element[0].clientWidth;
        var eleTop = parseFloat(element[0].getBoundingClientRect().top);

        eleWidth -= parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
        return {
          width: eleWidth + 'px',
          top: eleTop + 'px'
        };
      };
    }
  };
}