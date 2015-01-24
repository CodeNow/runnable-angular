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
    restrict: 'AE',
    scope: {
      template: '@'
    },
    link: function ($scope, element, attrs, ctrl) {
      $scope.coachMarkData = fetchCoachMarkData(attrs.type);
      if ($scope.coachMarkData.hasBeenViewed) { return; }
      if (!$scope.template) {
        return $log.error('Coach mark needs a template!');
      }
      var template = $templateCache.get('viewCoachMarks');
      var popEl = $compile(template)($scope);

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
      keypather.set($scope, 'coachMarkData.dismiss', function () {
        $scope.coachMarkData.show = false;
        $scope.coachMarkData.save();
        $timeout(function () {
          //popEl.remove();
        }, 10);
      });
      $scope.coachMarkData.getStyle = function () {
        var rect = element.parent()[0].getBoundingClientRect();
        return {
          'top': (rect.top + style.top) + 'px',
          'left': (rect.left + style.left) + 'px'
        };
      };
      $document.find('body').append(popEl);
      $scope.$on('$destroy', function () {
        if (popEl) {
          popEl.remove();
        }
      });
    }
  };
}
