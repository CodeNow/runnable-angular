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
  keypather,
  $log,
  exists
) {
  return {
    restrict: 'A',
    controller: 'PopOverController',
    controllerAs: 'POC',
    scope: scopeVars,
    link: function ($scope, element, attrs) {
      var previousStyle = {};
      var POC = $scope.POC;
      if ($scope.controller) {
        var controllerName = attrs.popOverController;
        if ($scope.controllerAs) {
          controllerName = $scope.controllerAs;
        }
        if (Object.keys(scopeVars).includes(controllerName)) {
          throw new Error('Tried to initialize a popover with a name which would override isolated scope variable');
        }
        $scope[controllerName] = $scope.controller;
      }

      if (!$scope.template) {
        // Check if the string is set by checking the attrs
        if (attrs.popOverTemplate) {
          $scope.template = attrs.popOverTemplate;
        } else {
          return $log.error('Pop over needs a template');
        }
      }
      $scope.popoverOptions = $scope.popoverOptions || {};
      $scope.active = $scope.active || false;
      $scope.popoverStyle = {
        getStyle: function () {
          if (!$scope.active) {
            return previousStyle;
          }
          var offset = {};

          var scrollTop = $document.find('body')[0].scrollTop || $document.find('html')[0].scrollTop;
          if (keypather.get($scope, 'popoverOptions.mouse')) {
            scrollTop = -scrollTop;
            offset = $scope.options.mouse;
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
            POC.popoverElement[0].offsetHeight + newOffset.top > $document.find('body')[0].offsetHeight
          ) {
            newOffset.top =  $document.find('body')[0].offsetHeight - POC.popoverElement[0].offsetHeight;
          }

          var keys = ['top', 'left', 'bottom', 'right'];
          var style = {};
          keys.forEach(function (key) {
            var keyOption = keypather.get($scope, 'popoverOptions.' + key);
            style[key] = !exists(keyOption) ? 'auto' : newOffset[key] + keyOption + 'px';
          });

          if (keypather.get($scope, 'popoverOptions.centered')) {
            style.right = null;
            style.left = Math.round((-POC.popoverElement[0].offsetWidth / 2 + offset.left + (offset.right - offset.left) / 2)) + 'px';
          }

          if (keypather.get($scope, 'popoverOptions.verticallyCentered')) {
            style.bottom = null;
            style.top = Math.round((-POC.popoverElement[0].offsetHeight / 2 + offset.top + (offset.bottom - offset.top) / 2)) + 'px';
          }

          previousStyle = style;
          return style;
        }
      };

      function clickHandler(event) {
        event.stopPropagation(); // If we don't stop prop we will immediately close ourselves!
        event.preventDefault();
        if (element.prop('disabled')) {
          return;
        }
        if ($scope.active) {
          POC.closePopover();
          return;
        }
        // Skip broadcasting if we're in a modal
        if (!$scope.noBroadcast) {
          $rootScope.$broadcast('app-document-click');
        }
        $scope.options = {
          mouse: {
            left: event.pageX,
            right: event.pageX,
            top: event.pageY,
            bottom: event.pageY
          }
        };
        POC.openPopover($scope.options);
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
        case 'hover':
          break;
        case 'activeAttr':
          var unwatchActive = $scope.$watch('active', function (newVal, oldVal) {
            if (newVal) {
              POC.openPopover();
            } else if (POC.popoverElementScope) {
              // Only close if we have opened a popover, it's not possible to open a popover without setting up the elementScope!
              POC.closePopover();
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
          POC.closePopover();
        }
      });
    }
  };
}
