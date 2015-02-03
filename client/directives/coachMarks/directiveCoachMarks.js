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
  $log
) {
  return {
    restrict: 'A',
    scope: {
      template: '@coachMarkTemplate' //The template is on the scope so it can be used by the view
    },
    link: function ($scope, element, attrs, ctrl) {
      var popEl;

      if (!$scope.template) {
        return $log.error('Coach mark needs a template');
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
        if ($scope.coachMarkData) {
          $scope.coachMarkData.show = false;
        }
        if (popEl) {
          popEl.remove();
        }
      });
    }
  };
}
