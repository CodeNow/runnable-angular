'use strict';

require('app')
  .directive('popOver', popOver);
/**
 * popOver Directive
 * @ngInject
 */
function popOver(
  debounce,
  $compile,
  $templateCache,
  $log,
  $document
) {
  return {
    restrict: 'E',
    scope: {
      data: '=',
      actions: '=',
      popoverReady: '=',
      popoverOptions: '@'
    },
    link: function ($scope, element, attrs) {

      var template = $templateCache.get(attrs.template);

      var options;

      var unwatch = $scope.$watch('popoverOptions', function (n) {
        if (n) {
          unwatch();
          try {
            options = JSON.parse($scope.popoverOptions);
          } catch (e) {
            $log.warn('popoverOptions parse failed for ' + attrs.template);
            options = {};
          }
          options.right = (typeof options.right !== 'undefined') ? options.right : 'auto';
          options.left = (typeof options.left !== 'undefined') ? options.left : 0;
          options.top = (typeof options.top !== 'undefined') ? options.top : 0;
          options.class = (typeof options.class !== 'undefined') ? options.class : false;
        }
      });

      var popEl = $compile(template)($scope);

      function setCSS() {
        var rect = element.parent()[0].getBoundingClientRect();
        popEl.css({
          'top': (rect.top + options.top) + 'px',
          'left': (rect.left + options.left) + 'px',
          'right': options.right
        });
      }

      var dSetCSS = debounce(setCSS, 100);
      var unwatchLocation = $scope.$watch(function () {
        return element.parent()[0].clientTop + 'x' + element.parent()[0].clientLeft;
      }, dSetCSS);

      $document.find('body').append(popEl);

      $scope.$watch(function () {
        return element.hasClass('in');
      }, function (n) {
        if (n) {
          var autofocus = element[0].querySelector('[autofocus]');
          if (autofocus) {
            autofocus.select();
          }
        }
      });

      element.on('click', function (event) {
        event.stopPropagation();
      });
      element.on('$destroy', function () {
        popEl.remove();
        element.off('click');
        unwatchLocation();
      });
    }
  };
}
