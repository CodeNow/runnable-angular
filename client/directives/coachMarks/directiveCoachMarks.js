'use strict';

require('app')
  .directive('showCoachMarks', showCoachMarks);
/**
 * @ngInject
 */
function showCoachMarks(
  $compile,
  fetchCoachMarkData,
  $templateCache,
  $document,
  $timeout,
  keypather,
  $log
) {
  return {
    restrict: 'A',
    scope: {
      template: '@'
    },
    link: function ($scope, element, attrs, ctrl) {
      var popEl;

      var style;
      try {
        style = JSON.parse(attrs.markStyle);
      } catch (e) {
        $log.warn('Coach mark parse failed for ' + attrs.type);
        style = {
          top: 0,
          left: -20
        };
      }
      fetchCoachMarkData(attrs.type, function (data) {
        if (!data) { return; }
        $scope.coachMarkData = data;
        if (!$scope.template) {
          return $log.error('Coach mark needs a template!');
        }

        keypather.set($scope, 'coachMarkData.dismiss', function () {
          $scope.coachMarkData.show = false;
          $scope.coachMarkData.save();
          $scope.coachMarkData.hideMark = true;
        });
        var template = $templateCache.get('viewCoachMarks');
        popEl = $compile(template)($scope);

        $scope.coachMarkData.getStyle = function () {
          var rect = element.parent()[0].getBoundingClientRect();
          return {
            'top': (rect.top + style.top) + 'px',
            'left': (rect.left + style.left) + 'px'
          };
        };
        $document.find('body').append(popEl);
      });
      $scope.$on('$destroy', function () {
        $scope.coachMarkData.show = false;
        if (popEl) {
          popEl.remove();
        }
      });
    }
  };
}
