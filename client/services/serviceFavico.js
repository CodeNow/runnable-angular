'use strict';

require('app')
  .factory('favico', function (keypather) {
    var favico = require('favico.js')({
      animation:'none'
    });

    var badge = function(num) {
      favico.badge(num);
    };
    var reset = function() {
      favico.reset();
    };
    var setImage = function(image) {
      favico.image(image);
    };
    var setInstanceState = function(instance) {
      favico.reset();
      var building = keypather.get(instance, 'build.attrs.started') &&
          !keypather.get(instance, 'build.attrs.completed');
      var running = keypather.get(instance, 'containers.models[0].attrs.inspect.State.Running');
      if (building || running) {
        var badgeColor = (building) ? '#f9c029' : '#3ccb5a';
        favico.badge(1, {
          bgColor: badgeColor,
          textColor: badgeColor,
          animation: 'none'
        });
      }
    };

    return {
      reset : reset,
      setImage: setImage,
      setInstanceState: setInstanceState
    };
  });
