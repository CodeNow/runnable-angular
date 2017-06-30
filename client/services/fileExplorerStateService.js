'use strict';

require('app')
  .factory('fileExplorerState', fileExplorerState);

function fileExplorerState() {
  var showing = true;
  return {
    isShowing: function () {
      return showing;
    },
    toggle: function () {
      showing = !showing;
    }
  };
}
