'use strict';

require('app')
  .factory('favico', function (
    $document,
    favicojs,
    keypather
  ) {
    var favico = favicojs({
      animation: 'none'
    });
    function createImage(url) {
      var img = $document[0].createElement('img');
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
    var setInstanceState = function (instance) {
      var building = keypather.get(instance, 'build.attrs.started') &&
          !keypather.get(instance, 'build.attrs.completed');
      var running = keypather.get(instance, 'containers.models[0].attrs.inspect.State.Running');
      var image = building ? icons.building : (running ?  icons.running : icons.stopped);
      favico.reset();
      favico.image(image);
    };

    return {
      reset : reset,
      setImage: setImage,
      setInstanceState: setInstanceState
    };
  });
