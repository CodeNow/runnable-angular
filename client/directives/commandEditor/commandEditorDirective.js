'use strict';

require('app')
  .directive('commandEditor', commandEditor);

/**
 * @ngInject
 */
function commandEditor(
  cardInfoTypes
) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, elem, attrs, ctrl) {
      // Good part of this ripped off of
      // https://github.com/angular/angular.js/blob/master/src/ng/directive/ngList.js

      ctrl.$parsers.push(function (value) {
        if (value === undefined) { return []; }

        return value.split('\n')
        .filter(Boolean)
        .map(function (v) {
          return new cardInfoTypes.Command('RUN ' + v);
        });
      });

      ctrl.$formatters.push(function (value) {
        if (value) {
          return value.map(function (a) {
            return a.body;
          }).join('\n');
        }
        return undefined;
      });

      // Override the standard $isEmpty because an empty array means the input is empty.
      ctrl.$isEmpty = function(value) {
        return !value || !value.length;
      };
    }
  };
}