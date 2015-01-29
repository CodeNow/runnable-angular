'use strict';

require('app')
  .factory('helperSetupTerminal', helperSetupTerminal);
/**
 * @ngInject
 */
function helperSetupTerminal(
  configTerminalOpts,
  debounce,
  Termjs
) {
  return function ($scope, elem, opts, onResize) {
    var CHAR_SIZE = getTerminalCharacterSize(elem);
    var config = angular.extend({}, configTerminalOpts);
    config = angular.extend(config, (opts || {}));
    if (elem[0].clientHeight > 100) {
      config.rows = Math.floor(elem[0].clientHeight / CHAR_SIZE.height);
    }
    if (elem[0].clientWidth > 100) {
      config.cols = Math.floor(elem[0].clientWidth / CHAR_SIZE.width);
    }
    var terminal = new Termjs(config);
    terminal.open(elem[0]);

    // Terminal sizing
    var oldX = 0;
    var oldY = 0;
    function resizeTerm() {
      // Tab not selected
      if (terminal.element.clientWidth <= 100) {
        return;
      }
      var CHAR_SIZE = getTerminalCharacterSize(elem);
      var x = Math.floor(terminal.element.clientWidth / CHAR_SIZE.width);
      if (x < configTerminalOpts.cols) {
        x = configTerminalOpts.cols;
      }
      var y = Math.floor(terminal.element.clientHeight / CHAR_SIZE.height) - 1;
      if (!(oldX === x && oldY === y)) {
        oldX = x;
        oldY = y;
        terminal.resize(x, y);
        if (onResize) {
          onResize(x, y);
        }
      }
    }

    var dResizeTerm = debounce(resizeTerm, 300);
    dResizeTerm();

    var unwatchResize = $scope.$watch(function () {
      return terminal.element.clientWidth + 'x' + terminal.element.clientHeight;
    }, dResizeTerm);

    $scope.$on('$destroy', function () {
      unwatchResize();
      terminal.destroy();
    });

    return terminal;
  };
}

function getTerminalCharacterSize(elem) {
  var temp = elem[0].querySelector('.js-char-width');
  return {
    width: temp ? temp.offsetWidth : 9,
    height: temp ? temp.offsetHeight : 19
  };
}
