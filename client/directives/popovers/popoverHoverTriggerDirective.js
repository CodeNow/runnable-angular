'use strict';
require('app').directive('popOverHoverTrigger', popOverHoverTrigger);

/**
 * PopoverHoverTrigger is a popover trigger that activates a popover when the user hovers over
 * the element, and keeps it open as long as the user heads toward the popover, until they hover off
 * of the popover, or go outside the triangle.  This directive handles all the events necessary to
 * make a popover activate this way, and all of the cleanup.
 *
 * The popOverTrigger attr for the popover needs to be set to 'hover'.
 *
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
      var boundaryValues = null;

      $scope.getPolygon = function () {
        if (!POC.popoverElement) {
          return;
        }
        var popoverClientRect = POC.popoverElement[0].getBoundingClientRect();
        var elementClientRect = element[0].getBoundingClientRect();

        /**
         * Adds tolerances to values in the array.  To subtract, send a negative value
         * @param sourceArray
         * @param valuesToAddArray
         * @returns {*}
         */
        function addTolerance(sourceArray, valuesToAddArray) {
          if (sourceArray.length !== valuesToAddArray.length) {
            throw new Error('AddTolerance inputs should be the same length');
          }
          return sourceArray.map(function (preToleranceValue, index) {
            return preToleranceValue + valuesToAddArray[index];
          });
        }
        // Tolerance is used to adjust how accurate the hovering needs to be.
        var tolerance = (attrs.popOverHoverTolerance) ? $scope.$eval(attrs.popOverHoverTolerance) : 10;

        // We add/subtract tolerance to
        var popoverRect = {
          topLeft : [popoverClientRect.left, popoverClientRect.top],
          topRight: [popoverClientRect.right, popoverClientRect.top],
          bottomLeft : [popoverClientRect.left, popoverClientRect.bottom],
          bottomRight: [popoverClientRect.right, popoverClientRect.bottom]
        };
        var elementRect = {
          topLeft : [elementClientRect.left, elementClientRect.top],
          topRight: [elementClientRect.right, elementClientRect.top],
          bottomLeft : [elementClientRect.left, elementClientRect.bottom],
          bottomRight: [elementClientRect.right, elementClientRect.bottom]
        };


        if (POC.popoverElement.hasClass('bottom')) {
          return [
            elementRect.topLeft,
            addTolerance(popoverRect.topLeft, [-tolerance, tolerance]),
            addTolerance(popoverRect.topRight, [tolerance, tolerance]),
            elementRect.topRight
          ];
        } else if (POC.popoverElement.hasClass('top')) {
          return [
            addTolerance(popoverRect.bottomLeft, [-tolerance, -tolerance]),
            elementRect.bottomLeft,
            elementRect.bottomRight,
            addTolerance(popoverRect.bottomRight, [tolerance, -tolerance])
          ];
        } else if (POC.popoverElement.hasClass('left')) {
          return [
            addTolerance(popoverRect.bottomRight, [-tolerance, tolerance]),
            addTolerance(popoverRect.topRight, [-tolerance, -tolerance]),
            elementRect.topRight,
            elementRect.bottomRight
          ];
        } else if (POC.popoverElement.hasClass('right')) {
          return [
            elementRect.topLeft,
            elementRect.bottomLeft,
            addTolerance(popoverRect.bottomLeft, [tolerance, tolerance]),
            addTolerance(popoverRect.topLeft, [tolerance, -tolerance])
          ];
        }
      };

      function isInsidePolygon(e) {
        if (!boundaryValues) {
          boundaryValues = $scope.getPolygon();
        }
        if (!boundaryValues) {
          return false;
        }
        return pointInPolygon([e.clientX, e.clientY], boundaryValues);
      }

      function checkAngleOnMouseMove(event) {
        if (!isInsidePolygon(event)) {
          cleanUp();
        }
      }

      function onElementMouseLeave() {
        element.off('mouseleave', onElementMouseLeave);
        $document.on('mousemove', checkAngleOnMouseMove);
        POC.popoverElement.on('mouseenter', function () {
          // When the user enters the popover, we should stop listening for the mouse movements
          $document.off('mousemove', checkAngleOnMouseMove);
        });
      }

      function cleanUp() {
        if (POC.popoverElement) {
          POC.popoverElement.off('mouseleave');
          POC.popoverElement.off('mouseenter');
        }
        POC.closePopover();
        $document.off('mousemove', checkAngleOnMouseMove);
      }

      function onMouseOver(e) {
        if (POC.isPopoverActive()) {
          // If the element is already there, don't do anything
          return;
        }
        boundaryValues = null;
        POC.openPopover(e);
        element.on('mouseleave', onElementMouseLeave);
        POC.popoverElement.on('mouseleave', cleanUp);
      }

      element.on('mouseenter', onMouseOver);
      $scope.$on('$destroy', function () {
        cleanUp();
        element.off('mouseenter', onMouseOver);
      });
    }
  };
}
