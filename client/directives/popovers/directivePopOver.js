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
  exists
) {
  return {
    restrict: 'A',
    scope: {
      data: '=? popOverData',
      popoverOptions: '=? popOverOptions',
      noBroadcast: '=? popOverNoBroadcast',
      actions: '=? popOverActions',
      active: '=? popOverActive',
      template: '= popOverTemplate'
    },
    link: function ($scope, element, attrs) {
      if (!$scope.template) {
        // Check if the string is set by checking the attrs
        if (attrs.popOverTemplate) {
          $scope.template = attrs.popOverTemplate;
        } else {
          return $log.error('Pop over needs a template');
        }
      }
      var unbindDocumentClick = angular.noop;
      var unbindPopoverOpened = angular.noop;
      $scope.popoverOptions = $scope.popoverOptions || {};
      $scope.active = false;

      var popoverElement;
      var popoverElementScope;

      $scope.closePopover = function () {
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
      };
      function openPopover(options) {
        $scope.popoverOptions = $scope.popoverOptions || {};

        if (!exists($scope.popoverOptions.top) && !exists($scope.popoverOptions.bottom)) {
          $scope.popoverOptions.top = 0;
        }
        if (!exists($scope.popoverOptions.left) && !exists($scope.popoverOptions.right)) {
          $scope.popoverOptions.left = 0;
        }

        $rootScope.$broadcast('close-popovers');
        // If the click has no target we should close the popover.
        // If the click has a target and that target is on the page but not on our popover we should close the popover.
        // Otherwise we should keep the popover alive.
        unbindDocumentClick = $scope.$on('app-document-click', function (event, target) {
          if(!target || (target && $document[0].contains(target) && !popoverElement[0].contains(target))){
            $scope.closePopover();
          }
        });
        unbindPopoverOpened = $scope.$on('close-popovers', function () {
          $scope.closePopover();
        });

        var template = $templateCache.get($scope.template);

        // We need to create a custom scope so we can call $destroy on it when the element is removed.
        popoverElementScope = $scope.$new();
        $scope.popoverElementScope = popoverElementScope;
        popoverElementScope.popoverStyle = {
          getStyle: function () {
            var offset = {};

            if (keypather.get($scope,'popoverOptions.mouse')) {
              offset = options.mouse;
            } else {
              offset = element[0].getBoundingClientRect();
            }

            var scrollTop = $document.find('body')[0].scrollTop;
            var width = $document.find('html')[0].clientWidth;
            var newOffset = {
              top: scrollTop + offset.top,
              left: offset.left,
              bottom: scrollTop + offset.bottom,
              right: width - offset.right
            };

            if ($scope.popoverElement[0].offsetHeight + newOffset.top > $document.find('body')[0].offsetHeight) {
              newOffset.top =  $document.find('body')[0].offsetHeight - $scope.popoverElement[0].offsetHeight;
            }

            var keys = ['top', 'left', 'bottom', 'right'];
            var style = {};
            keys.forEach(function (key) {
              var keyOption = keypather.get($scope, 'popoverOptions.'+key);
              style[key] = !exists(keyOption) ? 'auto' : newOffset[key] + keyOption + 'px';
            });
            return style;
          }
        };

        // Temporary workaround until I create a PR for angular to not have a nonsense error
        //   Error: [jqLite:nosel] Looking up elements via selectors is not supported by jqLite!
        // Not terribly descriptive, guys.
        // https://github.com/angular/angular.js/pull/11688
        if (!template) {
          throw new Error('Popover template not found: ' + $scope.template);
        }
        popoverElement = $compile(template)(popoverElementScope);
        $scope.popoverElement = popoverElement;
        $document.find('body').append(popoverElement);
        // Trigger a digest cycle
        $timeout(angular.noop);

        $timeout(function(){
          $scope.active = true;
        }, 0);
      }
      function clickHandler(event) {
        event.stopPropagation(); // If we don't stop prop we will immediately close ourselves!
        event.preventDefault();
        if (element.prop('disabled')) {
          return;
        }
        if ($scope.active) {
          $scope.closePopover();
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
          if (typeof keypather.get($scope, 'popoverOptions.mouse') === 'undefined') {
            keypather.set($scope, 'popoverOptions.mouse', true);
          }
          element.on('contextmenu', clickHandler);
          $scope.$on('$destroy', function () {
            element.off('contextmenu');
          });
          break;
        case 'activeAttr':
          var unwatchActive = $scope.$watch('active', function (newVal) {
            if (newVal) {
              openPopover();
            } else {
              $scope.closePopover();
            }
          });
          $scope.$on('$destroy', function () {
            unwatchActive();
          });
          break;
        default:
          element.on('click', clickHandler);
          $scope.$on('$destroy', function () {
            element.off('click');
          });
      }

      $scope.$on('$destroy', function () {
        if ($scope.active) {
          $scope.closePopover();
        }
      });
    }
  };
}
