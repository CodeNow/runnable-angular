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
      return {
        valid: true,
        errors: []
      };
    }
    var response = {
      valid: true,
      errors: []
    };
    var keys = [];
    input.forEach(function (line, index) {
      //empty line, ignore
      if (line.trim() === '') {
        return;
      }
      // Check for syntactic validity
      if (!/^([A-z]+[A-z0-9]*)=.*$/.test(line)) {
        response.valid = false;
        response.errors.push(index);
        return;
      }
      // Check for a duplicate key
      var key = line.split('=')[0];
      if (keys.indexOf(key) > -1) {
        response.valid = false;
        response.errors.push(index);
        return;
      }
      keys.push(key);
    });
    return response;
  };
}
