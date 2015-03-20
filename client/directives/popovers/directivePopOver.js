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
  $log
) {
  return {
    restrict: 'A',
    scope: {
      data: '=? popOverData',
      popoverOptions: '=? popOverOptions',
      noBroadcast: '=? popOverNoBroadcast',
      actions: '=? popOverActions',
      active: '=? popOverActive',
      template: '@ popOverTemplate'
    },
    link: function ($scope, element, attrs) {
      if (!$scope.template) {
        return $log.error('Pop over needs a template');
      }
      var unbindDocumentClick = angular.noop;
      var unbindPopoverOpened = angular.noop;
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
            popoverElementScope.$destroy();
            popoverElement.remove();
          }, 500);
        }(popoverElementScope, popoverElement));
      }
      function openPopover(options) {
        $scope.popoverOptions = $scope.popoverOptions || {};

        if (!$scope.popoverOptions.top && !$scope.popoverOptions.bottom) {
          $scope.popoverOptions.top = 0;
        }
        if (!$scope.popoverOptions.left && !$scope.popoverOptions.right) {
          $scope.popoverOptions.left = 0;
        }
        console.log('Opening: ', $scope.template);
        console.log($scope.popoverOptions);

        $rootScope.$broadcast('close-popovers');
        unbindDocumentClick = $scope.$on('app-document-click', function () {
          $scope.closePopover();
        });
        unbindPopoverOpened = $scope.$on('close-popovers', function () {
          $scope.closePopover();
        });

        var template = $templateCache.get($scope.template);

        // We need to create a custom scope so we can call $destroy on it when the element is removed.
        popoverElementScope = $scope.$new();
        popoverElementScope.popoverStyle = {
          getStyle: function () {
            var offset = {};

            if (keypather.get($scope,'popoverOptions.mouse')) {
              offset = options.mouse;
            } else {
              offset = element[0].getBoundingClientRect();
            }

            var keys = ['top', 'left', 'bottom', 'right'];
            var style = {};
            keys.forEach(function (key) {
              var keyOption = keypather.get($scope, 'popoverOptions.'+key);
              style[key] = (keyOption === null) ? 'auto' : offset[key] + keyOption + 'px';
            });
            return style;
          }
        };

        popoverElement = $compile(template)(popoverElementScope);
        $document.find('body').append(popoverElement);
        // Trigger a digest cycle
        $timeout(angular.noop);

        $timeout(function(){
          $scope.active = true;
        }, 0);


        // Prevent clicking on the popover from triggering us to close the popover!
        popoverElement.on('click', function(event) {
          event.stopPropagation();
        });
      }
      function clickHandler(event) {
        event.stopPropagation();
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
        default:
          element.on('click', clickHandler);
          $scope.$on('$destroy', function () {
            element.off('click');
          });
      }
    }
  };
}
