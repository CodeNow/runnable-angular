'use strict';
require('app').directive('popOverHoverTrigger', popOverHoverTrigger);

/**
 *
 * @param $document
 * @param pointInPolygon
 * @returns {{restrict: string, require: string, link: Function}}
 */
function popOverHoverTrigger(
  $document,
  pointInPolygon
) {
  return {
    restrict: 'A',
    require: '^popOver',
    link: function ($scope, element, attrs, POC) {
      var initialMouseEvent = null;
      var boundaryValues = null;

      $scope.getPolygon = function () {
        var boundingRect = POC.popoverElement[0].getBoundingClientRect();

        var tolerance = attrs.popOverHoverTolerance || 10;
        var mousePositionVerticalTolerance = [
          [initialMouseEvent.pageX, initialMouseEvent.pageY + tolerance],
          [initialMouseEvent.pageX, initialMouseEvent.pageY - tolerance]
        ];
        var mousePositionHorizontalTolerance = [
          [initialMouseEvent.pageX - tolerance, initialMouseEvent.pageY],
          [initialMouseEvent.pageX + tolerance, initialMouseEvent.pageY]
        ];

        var topLeft = [boundingRect.left - tolerance, boundingRect.top - tolerance];
        var topRight = [boundingRect.right + tolerance, boundingRect.top - tolerance];
        var bottomLeft = [boundingRect.left - tolerance, boundingRect.bottom + tolerance];
        var bottomRight = [boundingRect.right + tolerance, boundingRect.bottom + tolerance];

        if (POC.popoverElement.hasClass('bottom')) {
          return mousePositionHorizontalTolerance.concat([topLeft, topRight]);
        } else if (POC.popoverElement.hasClass('top')) {
          return mousePositionHorizontalTolerance.concat([bottomLeft, bottomRight]);
        } else if (POC.popoverElement.hasClass('left')) {
          return mousePositionVerticalTolerance.concat([topRight, bottomRight]);
        } else if (POC.popoverElement.hasClass('right')) {
          return mousePositionVerticalTolerance.concat([bottomLeft, topLeft]);
        }
      };

      $scope.isInsidePolygon = function (e) {
        if (e.pageX === initialMouseEvent.pageX && e.pageY === initialMouseEvent.pageY) {
          return true;
        }
        if (!boundaryValues) {
          boundaryValues = $scope.getPolygon();
        }
        console.log('pointInPolygon', [e.pageX, e.pageY], JSON.stringify(boundaryValues));
        return pointInPolygon([e.pageX, e.pageY], boundaryValues);
      };

      function checkAngleOnMouseMove(event) {
        if (!$scope.isInsidePolygon(event)) {
          console.log('OUT OF BOUNDARY');
          cleanUp();
        }
      }

      function onElementMouseLeave() {
        console.log('element mouseleave');
        element.off('mouseleave', onElementMouseLeave);
        $document.on('mousemove', checkAngleOnMouseMove);
      }

      function cleanUp() {
        if (POC.popoverElement) {
          POC.popoverElement.off('mouseleave', cleanUp);
        }
        POC.closePopover();
        $document.off('mousemove', checkAngleOnMouseMove);
      }

      function onActivateHover(e) {
        initialMouseEvent = e;
        boundaryValues = null;
        console.log('onActivateHover');
        element.on('mouseleave', onElementMouseLeave);
        POC.popoverElement.on('mouseleave', cleanUp);
      }

      function onMouseOver(e) {
        if (POC.isPopoverActive()) {
          // If the element is already there, don't do anything
          return;
        }
        POC.openPopover(e);
        onActivateHover(e);
      }

      element.on('mouseenter', onMouseOver);
      $scope.$on('$destroy', function () {
        cleanUp();
        element.off('mouseenter', onMouseOver);
      });
    }
  };
}
