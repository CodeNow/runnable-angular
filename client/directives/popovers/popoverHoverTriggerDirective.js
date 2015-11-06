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
      var boundaryValues = null;

      $scope.getPolygon = function () {
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
            elementRect.topRight,
            addTolerance(popoverRect.topLeft, [-tolerance, tolerance]),
            addTolerance(popoverRect.topRight, [tolerance, tolerance])
          ];
        } else if (POC.popoverElement.hasClass('top')) {
          return [
            elementRect.bottomLeft,
            elementRect.bottomRight,
            addTolerance(popoverRect.bottomLeft, [-tolerance, -tolerance]),
            addTolerance(popoverRect.bottomRight, [tolerance, -tolerance])
          ];
        } else if (POC.popoverElement.hasClass('left')) {
          return [
            elementRect.topRight,
            elementRect.bottomRight,
            addTolerance(popoverRect.topRight, [-tolerance, -tolerance]),
            addTolerance(popoverRect.bottomRight, [-tolerance, tolerance])
          ];
        } else if (POC.popoverElement.hasClass('right')) {
          return [
            elementRect.topLeft,
            elementRect.bottomLeft,
            addTolerance(popoverRect.topLeft, [tolerance, -tolerance]),
            addTolerance(popoverRect.bottomLeft, [tolerance, tolerance])
          ];
        }
      };

      function isInsidePolygon(e) {
        if (!boundaryValues) {
          boundaryValues = $scope.getPolygon();
        }
        return pointInPolygon([e.pageX, e.pageY], boundaryValues);
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

      function onActivateHover() {
        boundaryValues = null;
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
        console.log('dsafasdfasdf');
        cleanUp();
        element.off('mouseenter', onMouseOver);
      });
    }
  };
}
