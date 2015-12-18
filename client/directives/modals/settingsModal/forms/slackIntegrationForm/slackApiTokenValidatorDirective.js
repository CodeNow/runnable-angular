'use strict';

require('app')
  .directive('slackApiTokenValidator', slackApiTokenValidator);
/**
 * @ngInject
 */
  function slackApiTokenValidator(
  $q,
  debounce,
  fetchSettings,
  verifyChatIntegration
  ) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function ($scope, element, attrs, ctrl) {

      // We need to debounce this function, but an asynchronous validator always
      // needs to return a promise
      var _validateApiToken = debounce(function (modelValue, viewValue, cb) {
          var promise = fetchSettings()
            .then(function (settings) {
              return verifyChatIntegration(viewValue, settings, 'slack');
            });
          return cb(null, promise);
        }, 250);

      ctrl.$asyncValidators.validApiToken = function (modelValue, viewValue) {
        var deferred = $q.defer();
        _validateApiToken(modelValue, viewValue, function (err, promise) {
          deferred.resolve(promise);
        });
        return deferred.promise;
      };
    }
  };
}
