'use strict';

require('app')
  .factory('promisify', promisify);

function promisify($exceptionHandler, $q) {
  return function promisify(model, fn, skipCache) {
    if (!model[fn]) {
      throw new Error('Attempted to call a function of a model that doesn\'t exist');
    }
    if (fn.toLowerCase().indexOf('fetch') < 0) {
      skipCache = true;
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
      try {
        // Check returnedVal.attrs
        returnedVal = model[fn].apply(model, args);
        var validCache = returnedVal &&
            ((returnedVal.attrs && Object.keys(returnedVal.attrs).length > 2) ||
            (returnedVal.models && returnedVal.models.length));
        // For Models || Collections
        // length > 2 because sometimes, the api-client will send back an empty model with 1 attribute
        if (!skipCache && validCache) {
          d.resolve(returnedVal);
        }
      } catch (e) {
        $exceptionHandler(e);
        d.reject(e);
      }
      return d.promise;
    };
  };
}
