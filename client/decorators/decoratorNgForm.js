'use strict';

require('app')
  .config(['$provide', function ($provide) {
    $provide.decorator('formDirective', ['$delegate', function ($delegate) {
      var form = $delegate[0],
        controller = form.controller;

      form.controller = [
        '$scope',
        '$element',
        '$attrs',
        '$injector',
        function (scope, element, attrs, injector) {
          var $interpolate = injector.get('$interpolate');
          attrs.$set('name', $interpolate(attrs.name || attrs.ngForm || '')(scope));
          injector.invoke(controller, this, {
            '$scope': scope,
            '$element': element,
            '$attrs': attrs
          });
        }
      ];

      return $delegate;
    }]);
  }]);
