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
    var buildingImage = createImage('/build/images/favicon-orange.png');
    var icons = {
      building: buildingImage,
      neverStarted: buildingImage,
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
