'use strict';

require('app')
  .factory('validateEnvVars', validateEnvVars);
/**
 * @ngInject
 * @return {valid: bool, errors: object}
 */
function validateEnvVars() {
  return function (input) {
    if (typeof input === 'string') {
      input = input.split('\n');
    } else if (!Array.isArray(input)) {
      input = [];
    }
    var response = {
      valid: true,
      errors: []
    };
    input.forEach(function (line, index) {
      if (line.trim() === '') {
        //empty line, ignore
        response.valid = response.valid && true;
      } else if (/^([A-Za-z]+[A-Za-z0-9_]*)=('(\n[^']*')|("[^"]*")|([^\s#]+))$/.test(line)) {
        response.valid = response.valid && true;
      } else {
        response.valid = false;
        response.errors.push(index);
      }
    });
    return response;
  };
}
