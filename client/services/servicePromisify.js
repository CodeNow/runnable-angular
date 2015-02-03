'use strict';

require('app')
  .factory('promisify', promisify);

function promisify($exceptionHandler, $q) {
  return function promisify(model, fn) {
    if (!model[fn]) {
      throw new Error('Attempted to call a function of a model that doesn\'t exist');
    }
    return function promsified () {
      var d = $q.defer();
      var args = [].slice.call(arguments);
      var returnedVal;
      args.push(function (err, data) {
        if(err) {
          d.reject(err);
        } else {
          if (returnedVal) {
            return d.resolve(returnedVal);
          }
          // It's a fetch/build/etc
          d.resolve(model);
        }
      });
      try {
        // Check returnedVal.attrs
        returnedVal = model[fn].apply(model, args);
        // For Models || Collections
        if (returnedVal && ((returnedVal.attrs && Object.keys(returnedVal.attrs).length > 1) ||
            (returnedVal.models && returnedVal.models.length))) {
          d.resolve(returnedVal);
        }
      } catch(e) {
        $exceptionHandler(e);
        d.reject(e);
      }
      return d.promise;
    };
  };
}