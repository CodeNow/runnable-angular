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
  keypather,
  $log,
  $timeout
) {
  return {
    restrict: 'A',
    link: function ($scope, element, attrs, ctrl) {
      var popEl;

      if (!attrs.coachMarkTemplate) {
        return $log.error('Coach mark needs a template');
      } else {
        $scope.coachMarkTemplate = attrs.coachMarkTemplate;
      }
      if (!attrs.coachMarkType) {
        return $log.error('Coach mark needs a type');
      }
      var style;
      try {
        style = JSON.parse(attrs.coachMarkStyle);
      } catch (e) {
        $log.warn('Coach mark parse failed for ' + attrs.coachMarkType);
        style = {
          top: 0,
          left: -20
        };
      }
      fetchCoachMarkData(attrs.coachMarkType, function (data) {
        if (!data) { return; }
        $scope.coachMarkData = data;

        keypather.set($scope, 'coachMarkData.dismiss', function () {
          $scope.coachMarkData.save();
          $scope.$broadcast('close-popovers');
          $timeout(function () {
            popEl.remove();
          }, 250);
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
        if ($scope.coachMarkData) {
          $scope.$broadcast('close-popovers');
        }
        if (popEl) {
          popEl.remove();
        }
      });
    }
  };
}
