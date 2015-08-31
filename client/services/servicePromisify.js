'use strict';

require('app')
  .factory('promisify', promisify);

function promisify($exceptionHandler, $q) {
  return function promisify(modelOrCollection, fn, skipCache) {
    if (!modelOrCollection[fn]) {
      // This may provide false positives, but we're only using it for debugging
      // so let's just leave it as is
      var constructorName = /^function\s+([\w\$]+)\s*\(/.exec( modelOrCollection.constructor.toString() );
      throw new Error('Attempted to call function ' + fn + ' with constructor  ' + constructorName[1] + ' that doesn\'t exist');
    }
    if (fn.toLowerCase().indexOf('fetch') < 0) {
      skipCache = true;
    }
    return function promsified() {
      var d = $q.defer();
      var args = [].slice.call(arguments);
      var returnedVal;
      // Append a callback function to the arguments
      args.push(function (err) {
        if (err) {
          d.reject(err);
        } else {
          if (returnedVal) {
            return d.resolve(returnedVal);
          }
          // It's a fetch/build/etc
          d.resolve(modelOrCollection);
        }
      });
      try {
        // Execute the method given and store the returned value
        returnedVal = modelOrCollection[fn].apply(modelOrCollection, args);
        // Check that `returnedVal` to see if `modelOrCollection` is a collection
        // with more than 1 model (stored in cached). If it is, the return it because the cache is valid
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
