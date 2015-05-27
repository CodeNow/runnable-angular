'use strict';

require('app')
  .factory('favico', function (
    favicojs,
    $timeout,
    instanceStatus
  ) {
    var favico = favicojs({
      animation: 'none'
    });
    function createImage(url) {
      var img = new Image();
      img.src = url;
      return img;
    }
    var icons = {
      building: createImage('/build/images/favicon-orange.png'),
      running: createImage('/build/images/favicon-green.png'),
      stopped: createImage('/build/images/favicon-gray.png'),
      buildFailed: createImage('/build/images/favicon-red.png'),
      crashed: createImage('/build/images/favicon-red.png')
    };
    var currentState;
    var reset = function () {
      currentState = null;
      favico.reset();
    };
    var setImage = function (image) {
      favico.image(image);
    };
    var setInstanceState = function (instance) {
      if (instance) {
        var state = instanceStatus(instance);
        if (state !== currentState) {
          var icon = icons[state];
          if (icon) {
            favico.image(icon);
          } else {
            reset();
          }
          currentState = state;
          $timeout(angular.noop);
        }
      }
    };

    return {
      reset : reset,
      setImage: setImage,
      setInstanceState: setInstanceState
    };
  });
