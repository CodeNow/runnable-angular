'use strict';

require('app')
  .directive('ngClick', ngClick);

function ngClick(
  $document,
  eventTracking
) {
  return {
    restrict: 'A',
    priority: 100,
    link: function ($scope, element, attrs) {
      element.on('click', function () {
        var text = element.text().substring(0, 80);
        if (element[0] !== $document[0].body) {
          var cleanedAttrs = {};
          Object.keys(attrs).forEach(function (key) {
            if (key[0] !== '$') {
              cleanedAttrs[key] = attrs[key];
            }
          });
          eventTracking.trackClicked({
            attrs: cleanedAttrs,
            eventName: attrs.eventName,
            text: text
          });
        }
      });
    }
  };
}


