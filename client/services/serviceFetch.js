'use strict';

require('app')
  .factory('pFetchUser', function (user, $q) {
    // TODO: move.
    // Promise version of serviceFetchUser
    var pFetchUser = (function () {
      // http://stackoverflow.com/a/22655010/1216976
      var d = $q.defer();
      user.fetchUser('me', function (err) {
        if (err) {
          return d.reject(err);
        }
        return d.resolve(user);
      });
      return d.promise;
    })();

    return pFetchUser;
  })
  .factory('promisify', function($exceptionHandler, $q) {
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
        } catch(e) {
          $exceptionHandler(e);
          d.reject(e);
        }
        return d.promise;
      };
    };
  });

// // Look, I made it happen
// function fetch (
//   $exceptionHandler,
//   $q,
//   pFetchUser,
//   errs,
//   keypather,
//   user
// ) {
//   // Promisification
//   var promises = {};

//   var fetchUserPromise = pFetchUser.then(function(user) {
//     promises.fetchInstances = promisify(user, 'fetchInstances');
//     promises.fetchInstance = promisify(user, 'fetchInstance');
//     promises.fetchBuild = promisify(user, 'fetchBuild');
//   });


//User
// Build, contexts, GH Repos

//Context
//  Versions

// ContextVersion
// FS list

//   // user/instances

//   // Err handling and such
//   var fetchers = {
//     build: function(opts) {
//       return fetchUserPromise.then(function() {
//         return promises.fetchBuild(opts);
//       });
//     },
//     instance: function (opts) {
//       return fetchUserPromise.then(function () {
//         if (opts.name) {
//           return promises.fetchInstances(opts);
//         }
//         return promises.fetchInstance(opts);
//       })
//       .then(function(results) {
//         console.log('results', results);
//         var instance;
//         if (opts.name) {
//           instance = keypather.get(results, 'models[0]');
//           if (!keypather.get(instance, 'containers.models') || !instance.containers.models.length) {
//             throw new Error('Instance has no containers');
//           }
//         } else {
//           instance = results;
//         }

//         if (!instance) {
//           throw new Error('Instance not found');
//         }

//         return instance;
//       });
//     }
//   };

//   function fetchAPI (type, opts) {
//     return fetchers[type](opts)
//       .catch(errs.handler);
//   }


//   function promisify(model, fn) {
//     if (!model[fn]) {
//       throw new Error('Attempted to call a function of a model that doesn\'t exist');
//     }
//     return function promsified () {
//       var d = $q.defer();
//       var args = [].slice.call(arguments);
//       var returnedVal;
//       args.push(function (err, data) {
//         if(err) {
//           d.reject(err);
//         } else {
//           if (returnedVal) {
//             return d.resolve(returnedVal);
//           }
//           d.resolve(data);
//         }
//       });
//       try {
//         returnedVal = model[fn].apply(model, args);
//       } catch(e) {
//         $exceptionHandler(e);
//         d.reject(e);
//       }
//       return d.promise;
//     };
//   }

//   return fetchAPI;
// }