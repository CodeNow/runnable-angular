'use strict';

require('app')
  .factory('favico', function (
    favicojs,
    $timeout,
    getInstanceClasses
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
      failed: createImage('/build/images/favicon-red.png')
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
      var state = '';
      var classes = getInstanceClasses();
      if (classes.running) {
        state = 'running';
      } else if (classes.stopped) {
        state = 'stopped';
      } else if (classes.building) {
        state = 'building';
      } else if (classes.failed) {
        state = 'failed';
      }
      if (state !== currentState) {
        currentState = state;
        favico.image(icons[state]);
        $timeout(angular.noop);
      }
    };

    return {
      reset : reset,
      setImage: setImage,
      setInstanceState: setInstanceState
    };
  });
