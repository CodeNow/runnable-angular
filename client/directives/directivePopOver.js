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
  $window
) {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      data: '=',
      actions: '='
    },
    link: function ($scope, element, attrs) {
      var $ = jQuery;

      var template = $templateCache.get(attrs.template);

      var options;
      try {
        options = JSON.parse(attrs.popoverOptions);
      } catch (e) {
        options = {};
      }
      options.right = (typeof options.right !== 'undefined') ? options.right : 'auto';
      options.left = (typeof options.left !== 'undefined') ? options.left : 0;
      options.top = (typeof options.top !== 'undefined') ? options.top : 0;
      options.class = (typeof options.class !== 'undefined') ? options.class : false;

      var parent = $(element.parent());

      var popEl = $compile(template)($scope);

      function setCSS () {
        popEl.css({
          right: options.right + 'px',
          left: (parent.offset().left + options.left) + 'px',
          top: (parent.offset().top + options.top) + 'px'
        });
      }

      setCSS();

      var dSetCSS = debounce(setCSS, 100);
      $($window).on('resize', dSetCSS);

      $('body').append(popEl);

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
