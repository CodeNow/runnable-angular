'use strict';
require('app').directive('popOverHoverTrigger', popOverHoverTrigger);


/**
 * popOverHoverTrigger
 * @param $document
 * @returns {{restrict: string, require: string, link: Function}}
 */
function popOverHoverTrigger(
  $document
) {
  return {
    restrict: 'A',
    require: '^popOver',
    link: function ($scope, element, attrs, POC) {
      var initialMouseEvent = null;
      var popoverAngle1 = null;
      var popoverAngle2 = null;

      function getAngleOfMovement(firstPoint, secondPoint) {
        return Math.tan((firstPoint.pageY - secondPoint.pageY) / (firstPoint.pageX - secondPoint.pageX));
      }

      function getCenterPoint(start, finish) {
        return start + (finish - start);
      }

      /**
       *  slopeInvert: Standard slope is y/x, so when we use the y coordinate instead of the x,
       *  we need to flip it
       * @returns {{boundary: *, slope}}
       */
      function getBoundaryValues() {
        var boundingRect = POC.popoverElement[0].getBoundingClientRect();
        if (POC.popoverElement.hasClass('bottom')) {
          return {
            boundary: getCenterPoint(boundingRect.top, boundingRect.bottom),
            slopeInvert: true
          };
        }
      }
      function getValues() {
        if (!POC.popoverElement) {
          return;
        }
        var boundingRect = POC.popoverElement[0].getBoundingClientRect();
        if (POC.popoverElement.hasClass('bottom')) {
          return [{pageX: boundingRect.left, pageY: boundingRect.top}, {
            pageX: boundingRect.right,
            pageY: boundingRect.top
          }];
        } else if (POC.popoverElement.hasClass('top')) {
          return [{pageX: boundingRect.left, pageY: boundingRect.bottom}, {
            pageX: boundingRect.right,
            pageY: boundingRect.bottom
          }];
        }
      }

      function getPointsFromPopover() {
        if (!POC.popoverElement) {
          return;
        }
        var boundingRect = POC.popoverElement[0].getBoundingClientRect();
        if (POC.popoverElement.hasClass('bottom')) {
          return [{pageX: boundingRect.left, pageY: boundingRect.top}, {
            pageX: boundingRect.right,
            pageY: boundingRect.top
          }];
        } else if (POC.popoverElement.hasClass('top')) {
          return [{pageX: boundingRect.left, pageY: boundingRect.bottom}, {
            pageX: boundingRect.right,
            pageY: boundingRect.bottom
          }];
        } else if (POC.popoverElement.hasClass('right')) {
          return [{pageX: boundingRect.left, pageY: boundingRect.top}, {
            pageX: boundingRect.left,
            pageY: boundingRect.bottom
          }];
        } else if (POC.popoverElement.hasClass('right')) {
          return [{pageX: boundingRect.right, pageY: boundingRect.top}, {
            pageX: boundingRect.right,
            pageY: boundingRect.bottom
          }];
        }
      }

      function isHeadingTowardPopover(e) {
        if (e.pageX === initialMouseEvent.pageX && e.pageY === initialMouseEvent.pageY) {
          return true;
        }
        if (!popoverAngle1) {
          var popoverPoints = getPointsFromPopover();
          popoverAngle1 = getAngleOfMovement(initialMouseEvent, popoverPoints[0]);
          popoverAngle2 = getAngleOfMovement(initialMouseEvent, popoverPoints[1]);
        }
        var mouseAngle = getAngleOfMovement(initialMouseEvent, e);
        var result = (popoverAngle1 <= mouseAngle && popoverAngle2 >= mouseAngle);
        console.log('isHeadingTowardPopover', result, popoverAngle1, popoverAngle2, mouseAngle);
        return result;
      }

      function checkAngleOnMouseMove(event) {
        if (!isHeadingTowardPopover(event)) {
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
        element.on('mouseleave', onElementMouseLeave);
        POC.popoverElement.on('mouseleave', cleanUp);
      }

      function onMouseOver(e) {
        if (POC.isPopoverActive()) {
          // If the element is already there, don't do anything
          return;
        }
        popoverAngle1 = null;
        popoverAngle2 = null;
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
