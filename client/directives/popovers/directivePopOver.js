'use strict';

require('app')
  .directive('popOver', popOver);
/**
 * togglePopOver Directive
 * @ngInject
 */


var scopeVars = {
  data: '=? popOverData',
  popoverOptions: '=? popOverOptions',
  noBroadcast: '=? popOverNoBroadcast',
  actions: '=? popOverActions',
  active: '=? popOverActive',
  template: '= popOverTemplate',
  controller: '=? popOverController',
  controllerAs: '@? popOverControllerAs'
};

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
    scope: scopeVars,
    link: function ($scope, element, attrs) {
      if ($scope.controller) {
        var controllerName = attrs.popOverController;
        if ($scope.controllerAs) {
          controllerName = $scope.controllerAs;
        }
        if (Object.keys(scopeVars).includes(controllerName)) {
          throw new Error('Tried to initialize a popover with a name which would override islated scope variable');
        }
        $scope[controllerName] = $scope.controller;
      }


      $scope.$localStorage = $localStorage;
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
      $scope.active = $scope.active || false;

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
          $timeout(function () {
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

        $timeout(function () {
          // If the click has no target we should close the popover.
          // If the click has a target and that target is on the page but not on our popover we should close the popover.
          // Otherwise we should keep the popover alive.
          unbindDocumentClick = $scope.$on('app-document-click', function (event, target) {
            if (!target || (target && $document[0].contains(target) && !popoverElement[0].contains(target))) {
              $scope.closePopover();
            }
          });
        }, 0);
        unbindPopoverOpened = $scope.$on('close-popovers', function () {
          $scope.closePopover();
        });

        var template = $templateCache.get($scope.template);

        // We need to create a custom scope so we can call $destroy on it when the element is removed.
        popoverElementScope = $scope.$new();
        $scope.popoverElementScope = popoverElementScope;
        var previousStyle = {};
        popoverElementScope.popoverStyle = {
          getStyle: function () {
            if (!$scope.active) {
              return previousStyle;
            }
            var offset = {};

            var scrollTop = $document.find('body')[0].scrollTop || $document.find('html')[0].scrollTop;
            if (keypather.get($scope, 'popoverOptions.mouse')) {
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

            if (
              $scope.popoverOptions.pinToViewPort && // If true, make sure popover is not displayed outside the viewport
              $scope.popoverElement[0].offsetHeight + newOffset.top > $document.find('body')[0].offsetHeight
            ) {
              newOffset.top =  $document.find('body')[0].offsetHeight - $scope.popoverElement[0].offsetHeight;
            }

            var keys = ['top', 'left', 'bottom', 'right'];
            var style = {};
            keys.forEach(function (key) {
              var keyOption = keypather.get($scope, 'popoverOptions.' + key);
              style[key] = !exists(keyOption) ? 'auto' : newOffset[key] + keyOption + 'px';
            });

            if (keypather.get($scope, 'popoverOptions.centered')) {
              style.right = null;
              style.left = (-$scope.popoverElement[0].offsetWidth / 2 + offset.left + (offset.right - offset.left) / 2) + 'px';
            }

            if (keypather.get($scope, 'popoverOptions.verticallyCentered')) {
              style.bottom = null;
              style.top = (-$scope.popoverElement[0].offsetHeight / 2 + offset.top + (offset.bottom - offset.top) / 2) + 'px';
            }

            previousStyle = style;
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
        $scope.active = true;
        // Trigger a digest cycle
        $scope.$evalAsync();
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
          if (keypather.get($scope, 'popoverOptions.mouse') === undefined) {
            keypather.set($scope, 'popoverOptions.mouse', true);
          }
          element.on('contextmenu', clickHandler);
          $scope.$on('$destroy', function () {
            element.off('contextmenu');
          });
          break;
        case 'activeAttr':
          var unwatchActive = $scope.$watch('active', function (newVal, oldVal) {
            if (newVal) {
              openPopover();
            } else if (popoverElementScope) {
              // Only close if we have opened a popover, it's not possible to open a popover without setting up the elementScope!
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
