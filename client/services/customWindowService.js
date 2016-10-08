'use strict';

require('app')
  .factory('customWindowService', customWindowService);

function customWindowService(
  keypather
) {
  return function (targetUrl, options) {
    var padding = 60;
    var width = window.innerWidth - padding - padding;
    var height = window.innerHeight - padding - padding - 50;
    if (keypather.has(options, 'width') && keypather.has(options, 'height')) {
      width = options.width;
      height = options.height;
    }

    var top = window.screenTop + height - (height / 2);
    var left = window.screenLeft + width - (width / 2);

    return window.open(targetUrl, 'page', 'toolbar=0,scrollbars=1,location=0,statusbar=0,menubar=0,resizable=0,width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',titlebar=yes');
  };
}

