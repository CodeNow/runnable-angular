'use strict';

require('app')
  .factory('favico', function (
    favicojs,
    keypather,
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
    var icons = {
      building: createImage('/build/images/favicon-orange.png'),
      running: createImage('/build/images/favicon-green.png'),
      stopped: createImage('/build/images/favicon-gray.png')
    };
    var reset = function () {
      favico.reset();
    };
    var setImage = function (image) {
      favico.image(image);
    };
    var currentState;
    var setInstanceState = function (instance) {
      var building = keypather.get(instance, 'build.attrs.started') &&
          !keypather.get(instance, 'build.attrs.completed');
      var running = keypather.get(instance, 'containers.models[0].attrs.inspect.State.Running');
      var state = building ? 'building' : (running ?  'running' : 'stopped');
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
