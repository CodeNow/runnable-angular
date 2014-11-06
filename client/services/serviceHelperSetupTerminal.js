require('app')
  .factory('helperSetupTerminal', helperSetupTerminal);
/**
 * @ngInject
 */
function helperSetupTerminal(
  configTerminalOpts,
  debounce,
  jQuery,
  termjs,
  $window
) {
  return function ($scope, elem) {
    var CHAR_HEIGHT = 20;
    var config = angular.extend({}, configTerminalOpts);
    config.rows = Math.floor(elem[0].clientHeight / CHAR_HEIGHT);
    var terminal = new termjs(config);
    terminal.open(elem[0]);

    // Terminal sizing
    var $termElem = jQuery(terminal.element);

    function resizeTerm() {
      // Tab not selected
      if ($termElem.width() === 100) {
        return;
      }
      var termLineEl = $termElem.find('div')[0];
      if (!termLineEl) {
        return;
      }
      var tBox = termLineEl.getBoundingClientRect();
      var charWidth = tBox.width / termLineEl.textContent.length;
      var x = Math.floor($termElem.width() / charWidth);
      if (x < 80) {
        x = 80;
      }
      var y = Math.floor($termElem.height() / CHAR_HEIGHT);
      terminal.resize(x, y);
    }

    var dResizeTerm = debounce(resizeTerm, 300);
    dResizeTerm();

    jQuery($window).on('resize', dResizeTerm);
    $scope.$on('$destroy', function () {
      jQuery($window).off('resize', dResizeTerm);
      terminal.destroy();
    });

    return terminal;
  };
}
