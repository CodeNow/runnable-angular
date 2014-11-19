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
  return function ($scope, elem, opts) {
    var CHAR_HEIGHT = 20;
    var config = angular.extend({}, configTerminalOpts);
    config = angular.extend(config, (opts || {}));
    config.rows = Math.floor(elem[0].clientHeight / CHAR_HEIGHT);
    var terminal = new termjs(config);
    terminal.open(elem[0]);

    // Terminal sizing
    var $termElem = jQuery(terminal.element);
    var oldX = 0;
    var oldY = 0;
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
      if (x < configTerminalOpts.cols) {
        x = configTerminalOpts.cols;
      }
      var y = Math.floor($termElem.height() / CHAR_HEIGHT);
      if (!(oldX === x && oldY === y)) {
        oldX = x;
        oldY = y;
        terminal.resize(x, y);
      }
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
