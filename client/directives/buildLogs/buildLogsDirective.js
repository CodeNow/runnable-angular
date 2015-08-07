'use strict';

require('app').directive('buildLogs', buildLogs);
function buildLogs(
  $timeout
) {
  return {
    restrict: 'A',
    templateUrl: 'buildLogsView',
    controller: 'BuildLogsController as BLC',
    bindToController: true,
    scope: {
      instance: '='
    },
    link: function ($scope) {
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