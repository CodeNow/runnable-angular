'use strict';

require('app')
  .factory('customWindowService', customWindowService);

function customWindowService() {
  return function (targetUrl) {
    var topBar = window.outerHeight - window.innerHeight;
    var padding = 60;
    var width = window.innerWidth - padding - padding;
    var height = window.innerHeight - padding - padding - 50;
    var top = window.screenTop + padding + topBar;
    var left = window.screenLeft + padding;
    return window.open(targetUrl, 'page', 'toolbar=0,scrollbars=1,location=0,statusbar=0,menubar=0,resizable=0,width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',titlebar=yes');
  };
}

