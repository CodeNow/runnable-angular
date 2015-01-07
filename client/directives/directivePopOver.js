require('app')
  .directive('popOver', popOver);
/**
 * popOver Directive
 * @ngInject
 */
function popOver(
  debounce,
  jQuery,
  $compile,
  $templateCache,
  $rootScope,
  $window
) {
  return {
    restrict: 'E',
    scope: {
      data: '=',
      actions: '=',
      popoverReady: '='
    },
    link: function ($scope, element, attrs) {
      var $ = jQuery;

      var template = $templateCache.get(attrs.template);

      var options;
      try {
        options = JSON.parse(attrs.popoverOptions);
      } catch (e) {
        console.warn('popoverOptions parse failed for ' + attrs.template);
        options = {};
      }
      options.right = (typeof options.right !== 'undefined') ? options.right : 'auto';
      options.left = (typeof options.left !== 'undefined') ? options.left : 0;
      options.top = (typeof options.top !== 'undefined') ? options.top : 0;
      options.class = (typeof options.class !== 'undefined') ? options.class : false;

      var parent = $(element.parent());

      var popEl = $compile(template)($scope);

      function parseProp (prop) {
        var curr = options[prop];
        if (!angular.isNumber(curr)) {
          return curr;
        }
        var parentVal = parent.offset()[prop];
        if (parentVal) {
          curr += parentVal;
        }
        return curr + 'px';
      }

      function setCSS () {
        var newCSS = {};
        newCSS.right = parseProp('right');
        newCSS.left = parseProp('left');
        newCSS.top = parseProp('top');
        popEl.css(newCSS);
      }

      setCSS();

      var dSetCSS = debounce(setCSS, 100);
      $($window).on('resize', dSetCSS);

      $('body').append(popEl);
      $scope.$watch('popoverReady', setCSS);

      $scope.$watch(function () {
        return element.hasClass('in');
      }, function(n) {
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
        $($window).off('resize', dSetCSS);
        element.off('click');
      });
    }
  };
}
