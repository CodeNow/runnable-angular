'use strict';

require('app').directive('buildLogs', buildLogs);
function buildLogs(
  $timeout,
  debounce,
  moment,
  $interval,
  keypather
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
      var scrollHelper = debounce(function () {
        if (!element[0]) {
          return;
        }
        var currentScroll = element[0].scrollTop;

        var children = element.children();
        var foundChild = null;
        var titleHeight = 0;
        if (children[0] && angular.element(children[0]).children()[0]) {
          titleHeight = angular.element(children[0]).children()[0].offsetHeight;
        }

        for (var i=0; i<children.length; i++) {
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


      var unwatchForMainHeader = $scope.$watch('BLC.buildLogs.length', function () {
        if ($scope.BLC.buildLogs.length > 0) {
          $scope.mainHeaderExpanded = false;
          unwatchForMainHeader();
        }
      });

      $scope.$watch(function() {
        return {
          buildLogs: $scope.BLC.buildLogs.length,
          childLogs: keypather.get($scope.BLC.buildLogs[$scope.BLC.buildLogs.length - 1], 'lineCount')
        };
      }, function () {
        scrollHelper();
        $timeout(scrollHelper, 100);
      }, true);

      var interval;
      $scope.$watch('BLC.buildLogsRunning', function (val) {
        if (interval) {
          $interval.cancel(interval);
        }

        if (val) {
          interval = $interval(function () {
            $scope.$applyAsync(angular.noop);
          }, 1000);
        }
      });

      element.on('scroll', scrollHelper);
      $scope.mainHeaderExpanded = true;
      $scope.actions = {
        toggleMainHeader: function () {
          if ($scope.BLC.buildLogs.length === 0) {
            return;
          }
          $scope.mainHeaderExpanded = !$scope.mainHeaderExpanded;
        },
        toggleCommand: function (event, command) {
          var index = $scope.BLC.buildLogs.indexOf(command);
          if (!command.hasContent || (index === ($scope.BLC.buildLogs.length - 1) && $scope.BLC.buildLogsRunning)) {
            return;
          }
          command.expanded = !command.expanded;
          if (command.expanded) {
            $timeout(function () {
              var logElement = angular.element(event.target).parent().parent().children()[1];
              if (logElement) {
                logElement.scrollTop = logElement.scrollHeight;
              }
            }, 0);
          }
        }
      };

      function getTimeDiff(end, start){
        end = moment(end);
        start = moment(start);
        var hours = end.diff(start, 'hours');
        var minutes = end.diff(start, 'minutes') % 60;
        var seconds = end.diff(start, 'seconds') % 60;

        var units = [];
        if (hours) {
          units.push(hours + 'h');
        }
        if (minutes) {
          units.push(minutes + 'm');
        }
        if (seconds) {
          units.push(seconds + 's');
        }

        return units.join(' ');
      }

      $scope.getCommandDuration = function (command, index) {
        if (!command.time || (index === 0 && !$scope.BLC.buildLogTiming.start)) {
          return;
        }

        var date1;
        if (index === 0) {
          date1 = $scope.BLC.buildLogTiming.start;
        } else {
          date1 = command.time;
        }

        var date2;
        if ($scope.BLC.buildLogs[index + 1]) {
          date2 = $scope.BLC.buildLogs[index + 1].time;
        } else if ($scope.BLC.buildLogTiming.end) {
          date2 = $scope.BLC.buildLogTiming.end;
        } else {
          date2 = new Date($scope.BLC.buildLogTiming.currentMachineTime);
        }
        return getTimeDiff(date2, date1);

      };

      $scope.calculateHeaderStyle = function (command) {
        if (!element[0] || !(command.expanded && command.fixed)) {
           return;
        }

        var style = window.getComputedStyle( element[0], null);
        var eleWidth = element[0].clientWidth;
        var eleTop = parseFloat(element[0].getBoundingClientRect().top);

        eleWidth -= parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + 2;
        return {
          width: eleWidth + 'px',
          top: eleTop + 'px'
        };
      };

      // Timer is here to make sure we don't show the "Sorry we ran into an issue" while we are loading logs
      // If after our timeout we still haven't gotten our first log we know it's probably not going to show
      $scope.timerExpired = false;
      $timeout(function () {
        $scope.timerExpired = true;
      }, 500);

      $scope.hasFailedAndHasNoLogs = function () {
        return (
          $scope.timerExpired &&
          $scope.BLC.buildLogs.length === 0 &&
          !$scope.BLC.buildLogsRunning &&
          $scope.BLC.buildStatus === 'failed'
        );
      };

      $scope.getBuildMessage = function () {

        var totalBuildTime;
        if ($scope.BLC.buildLogTiming.start && $scope.BLC.buildLogTiming.end){
          totalBuildTime = getTimeDiff($scope.BLC.buildLogTiming.end, $scope.BLC.buildLogTiming.start);
        }
        var buildMessage = 'Build ';
        if ($scope.BLC.buildStatus === 'failed') {
          buildMessage += $scope.BLC.failReason;
        } else if ($scope.BLC.buildStatus === 'success') {
          buildMessage += 'finished successfully';
        } else {
          return;
        }
        if (totalBuildTime) {
          buildMessage += ' after ' + totalBuildTime;
        }
        return buildMessage;
      };
    }
  };
}
