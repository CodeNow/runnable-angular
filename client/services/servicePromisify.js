'use strict';

require('app')
  .factory('promisify', promisify);

function promisify($exceptionHandler, $q) {
  return function promisify(model, fn, skipCache) {
    if (!model[fn]) {
      var modelName = /^function\s+([\w\$]+)\s*\(/.exec( model.toString() );
      if (modelName) {
        throw new Error('Attempted to call function ' + fn + ' of model ' + modelName[1] + ' that doesn\'t exist');
      } else {
        throw new Error('Attempted to call function ' + fn + ' on a non-model');
      }
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
