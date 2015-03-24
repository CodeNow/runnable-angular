'use strict';
var COLOR_SCHEMES = ['dark', 'light'];
require('app')
  .factory('colorScheme', function (
    keypather,
    $localStorage
  ) {
    var currentSchemeIndex = keypather.get($localStorage, 'colorScheme') || 0;
    return {
      isDarkScheme: function () {
        return currentSchemeIndex === 0;
      },
      toggleScheme: function () {
        currentSchemeIndex = (currentSchemeIndex + 1) % COLOR_SCHEMES.length;
        keypather.set($localStorage, 'colorScheme', currentSchemeIndex);
      },
      getCurrentScheme: function () {
        return COLOR_SCHEMES[currentSchemeIndex];
      },
      getSchemeStyle: function () {
        return {
          'ace-runnable-dark': currentSchemeIndex === 0
        };
      }
    };
  });
