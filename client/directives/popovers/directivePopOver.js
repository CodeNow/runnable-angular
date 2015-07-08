'use strict';

require('app')
  .directive('popOver', popOver);
/**
 * togglePopOver Directive
 * @ngInject
 */
function popOver(
  $rootScope,
  $document,
  $templateCache,
  $compile,
  $timeout,
  keypather,
  $log,
  exists,
  $localStorage
) {
  return {
    restrict: 'A',
    link: function ($scope, element, attrs) {
      // TODO
      $scope.noBroadcast = attrs.popOverNoBroadcast;

      if (!attrs.popOverTemplate) {
        return $log.error('Pop over needs a template');
      }

      var unbindDocumentClick = angular.noop;
      var unbindPopoverOpened = angular.noop;
      var popoverAlignment;
      try {
        popoverAlignment = JSON.parse(attrs.popOverOptions);
      } catch (e) {
        popoverAlignment = {};
      }
      $scope.active = $scope.active || false;

      var popoverElement;
      var popoverElementScope;

      function closePopover () {
        $scope.active = false;
        // trigger a digest because we are setting active to false!
        $timeout(angular.noop);

        unbindDocumentClick();
        unbindPopoverOpened();

        // We need a closure because they could technically re-open the popover and we want to manage THIS scope and THIS element.
        (function (popoverElementScope, popoverElement) {
          //Give the transition some time to finish!
          $timeout(function(){
            if (popoverElement) {
              popoverElement.remove();
            }
            if (popoverElementScope) {
              popoverElementScope.$destroy();
            }
          }, 500);
        }(popoverElementScope, popoverElement));
      }
      function openPopover(options) {

        if (!exists(popoverAlignment.top) && !exists(popoverAlignment.bottom)) {
          popoverAlignment.top = 0;
        }
        if (!exists(popoverAlignment.left) && !exists(popoverAlignment.right)) {
          popoverAlignment.left = 0;
        }

        $rootScope.$broadcast('close-popovers');
        // If the click has no target we should close the popover.
        // If the click has a target and that target is on the page but not on our popover we should close the popover.
        // Otherwise we should keep the popover alive.
        unbindDocumentClick = $scope.$on('app-document-click', function (event, target) {
          if(
            !target ||
            (
              $document[0].contains(target) &&
              !popoverElement[0].contains(target)
            )
          ) {
            closePopover();
          }
        });
        unbindPopoverOpened = $scope.$on('close-popovers', function () {
          closePopover();
        });

        var template = $templateCache.get(attrs.popOverTemplate);

        // We need to create a custom scope so we can call $destroy on it when the element is removed.
        popoverElementScope = $scope.$new();
        popoverElementScope.closePopover = closePopover;
        popoverElementScope.popoverStyle = {
          getStyle: function () {
            var offset = {};

            var scrollTop = $document.find('body')[0].scrollTop || $document.find('html')[0].scrollTop;
            if (popoverAlignment.mouse) {
              scrollTop = -scrollTop;
              offset = options.mouse;
            } else {
              offset = element[0].getBoundingClientRect();
            }

            var width = $document.find('html')[0].clientWidth;
            var newOffset = {
              top: scrollTop + offset.top,
              left: offset.left,
              bottom: scrollTop + offset.bottom,
              right: width - offset.right
            };

            if (popoverElement[0].offsetHeight + newOffset.top > $document.find('body')[0].offsetHeight) {
              newOffset.top =  $document.find('body')[0].offsetHeight - popoverElement[0].offsetHeight;
            }

            var keys = ['top', 'left', 'bottom', 'right'];
            var style = {};
            keys.forEach(function (key) {
              var keyOption = popoverAlignment[key];
              style[key] = !exists(keyOption) ? 'auto' : newOffset[key] + keyOption + 'px';
            });

            if (popoverAlignment.centered) {
              style.right = null;
              style.left = (-popoverElement[0].offsetWidth / 2 + offset.left + (offset.right - offset.left) / 2 ) + 'px';
            }

            return style;
          }
        };

        popoverElementScope.$on('$destroy', function () {
          if ($scope.active) {
            closePopover();
          }
        });

        // Temporary workaround until I create a PR for angular to not have a nonsense error
        //   Error: [jqLite:nosel] Looking up elements via selectors is not supported by jqLite!
        // Not terribly descriptive, guys.
        // https://github.com/angular/angular.js/pull/11688
        if (!template) {
          throw new Error('Popover template not found: ' + attrs.popOverTemplate);
        }
        popoverElement = $compile(template)(popoverElementScope);
        // $scope.popoverElement = popoverElement;
        $document.find('body').append(popoverElement);
        // Trigger a digest cycle
        $timeout(function(){
          $scope.active = true;
        });
      }
      function clickHandler(event) {
        event.stopPropagation(); // If we don't stop prop we will immediately close ourselves!
        event.preventDefault();
        if (element.prop('disabled')) {
          return;
        }
        if ($scope.active) {
          closePopover();
          return;
        }
        // Skip broadcasting if we're in a modal
        if (!$scope.noBroadcast) {
          $rootScope.$broadcast('app-document-click');
        }
        openPopover({
          mouse: {
            left: event.pageX,
            right: event.pageX,
            top: event.pageY,
            bottom: event.pageY
          }
        });
      }

      var trigger = attrs.popOverTrigger || 'click';
      switch (trigger) {
        case 'rightClick':
          if (typeof popoverAlignment.mouse === 'undefined') {
            popoverAlignment.mouse = true;
          }
          element.on('contextmenu', clickHandler);
          $scope.$on('$destroy', function () {
            element.off('contextmenu');
          });
          break;
        case 'activeAttr':
          $scope.$watch(attrs.popOverActiveAttr, function (newVal) {
            if (newVal) {
              openPopover();
            } else {
              closePopover();
            }
          });
          break;
        default:
          element.on('click', clickHandler);
          $scope.$on('$destroy', function () {
            element.off('click');
          });
      }
    }
  };
}