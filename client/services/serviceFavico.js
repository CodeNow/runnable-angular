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
    var icons = {
      building: $document[0].getElementById('js-favicon-building'),
      running: $document[0].getElementById('js-favicon-running'),
      stopped: $document[0].getElementById('js-favicon-stopped')
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
