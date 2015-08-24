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
      instance: '='
    },
    link: function ($scope, element) {
      var atBottom = true;
      var lockThreshold = 30;

      var scrollHelper = debounce(function (manual) {
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
        if (children[0]) {
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
      }, 50);

      var unbindContentWatch = angular.noop;
      $scope.$watch('BLC.buildLogs.length', function () {
        scrollHelper();
        if ($scope.BLC.buildLogs.length) {
          unbindContentWatch();
          unbindContentWatch = $scope.$watch('BLC.buildLogs[' + ($scope.BLC.buildLogs.length-1) + '].content.length', function () {
            scrollHelper();
          });
        }
      });

      element.on('scroll', function () {
        scrollHelper(true);
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

      $scope.calculateHeaderStyle = function (command) {
        var fixedWidth = command.expanded && command.fixed;
        var toggleFlags = $rootScope.featureFlags.fullScreenToggle || $rootScope.featureFlags.themeToggle; // if feature flags that changes width

        if (fixedWidth && toggleFlags) {
          // set width if header is fixed and shifting feature flags are active
          return {
            width: 'calc(100% - 591px)'
          };
        } else if (fixedWidth) {
          // set width if header is active and shifting feature flags are off
          return {
            width: 'calc(100% - 556px)'
          };
        }
      };
    }
  };
}