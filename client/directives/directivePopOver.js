require('app')
  .directive('popOver', popOver);
/**
 * popOver Directive
 * @ngInject
 */
function popOver(
  $templateCache,
  $compile,
  jQuery
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
      options.left = (typeof options.left !== 'undefined') ? options.left : 0;
      options.top = (typeof options.top !== 'undefined') ? options.top : 0;
      options.class = (typeof options.class !== 'undefined') ? options.class : false;

      var gParent = $(element.parent().parent());

      var popEl = $compile(template)($scope);

      popEl.css({
        top: (gParent.offset().top + options.top) + 'px',
        left: (gParent.offset().left + options.left) + 'px'
      });

      $('body').append(popEl);

      element.on('click', function (event) {
        event.stopPropagation();
      });
      element.on('$destroy', function () {
        element.off('click');
      });
    }
  };
}
