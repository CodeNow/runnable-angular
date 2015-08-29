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


      $scope.$watch(function() {
        return {
          buildLogs: $scope.BLC.buildLogs.length,
          childLogs: keypather.get($scope.BLC.buildLogs[$scope.BLC.buildLogs.length-1], 'content.length')
        };
      }, function () {
        scrollHelper();
        $timeout(scrollHelper, 100);
      });

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

      element.on('scroll', function () {
        scrollHelper(true);
      });

      $scope.actions = {
        toggleCommand: function (event, command) {
          if (!command.content.length || ($scope.BLC.buildLogs.indexOf(command) === ($scope.BLC.buildLogs.length - 1) && $scope.BLC.buildLogsRunning)) {
            return;
          }
          command.expanded = !command.expanded;
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
          date2 = new Date();
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

      $scope.getBuildMessage = function () {

        var totalBuildTime;
        if ($scope.BLC.buildLogTiming.start && $scope.BLC.buildLogTiming.end){
          totalBuildTime = getTimeDiff($scope.BLC.buildLogTiming.end, $scope.BLC.buildLogTiming.start);
        }
        var buildMessage = '';
        if ($scope.BLC.buildStatus === 'failed') {
          buildMessage += 'Build failed';
        } else if ($scope.BLC.buildStatus === 'success') {
          buildMessage += 'Build finished successfully';
        }
        if (totalBuildTime) {
          buildMessage += ' after ' + totalBuildTime;
        }
        return buildMessage;
      };
    }
  };
}