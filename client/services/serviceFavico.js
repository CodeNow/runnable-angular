'use strict';

require('app')
  .factory('favico', function (
    $document,
    favicojs,
    keypather
  ) {
    var favico = favicojs({
      animation:'none'
    });

    var badge = function (num) {
      favico.badge(num);
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
      var imageId = running ? 'js-favicon-running' : (building ? 'js-favicon-building' : 'js-favicon-stopped');
      favico.image($document[0].getElementById(imageId));
    };

    return {
      reset : reset,
      setImage: setImage,
      setInstanceState: setInstanceState
    };
  });
