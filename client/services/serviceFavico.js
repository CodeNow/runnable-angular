'use strict';

require('app')
  .factory('favico', function (
    favicojs,
    $timeout
  ) {
    var favico = favicojs({
      animation: 'none'
    });
    function createImage(url) {
      var img = new Image();
      img.src = url;
      return img;
    }

    var images = {
      orange: createImage('/build/images/favicon-orange.png'),
      green: createImage('/build/images/favicon-green.png'),
      gray: createImage('/build/images/favicon-gray.png'),
      red: createImage('/build/images/favicon-red.png')
    };

    var icons = {
      building: images.orange,
      neverStarted: images.orange,
      running: images.green,
      stopped: images.gray,
      buildFailed: images.red,
      crashed: images.red,
      starting: images.orange,
      stopping: images.green
    };
    var currentState;
    var reset = function () {
      currentState = null;
      favico.reset();
    };
    var setInstanceState = function (instance) {
      if (instance) {
        var state = instance.status();
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
      setInstanceState: setInstanceState
    };
  });
