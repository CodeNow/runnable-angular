'use strict';

require('app')
  .factory('promisify2', promisify);

function promisify($exceptionHandler, $q) {
  return function promisify(model, fn) {
    if (!model[fn]) {
      throw new Error('Attempted to call a function of a model that doesn\'t exist');
    }
    return function promsified() {
      var d = $q.defer();
      var args = [].slice.call(arguments);
      var returnedVal;
      args.push(function (err) {
        if (err) {
          d.reject(err);
        } else {
          if (returnedVal) {
            return d.resolve(returnedVal);
          }
          // It's a fetch/build/etc
          d.resolve(model);
        }
      });
      returnedVal = model[fn].apply(model, args);
      return d.promise;
    };
  };
}
