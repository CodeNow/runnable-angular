'use strict';

require('app')
  .directive('slackApiTokenValidator', slackApiTokenValidator);
/**
 * @ngInject
 */
  function slackApiTokenValidator(
  verifySlackAPITokenAndFetchMembers
  ) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function ($scope, element, attrs, ctrl) {
      // This function should be debounced using `ng-model-options`
      // https://docs.angularjs.org/api/ng/directive/ngModelOptions
      ctrl.$asyncValidators.validApiToken = function (modelValue, viewValue) {
        return verifySlackAPITokenAndFetchMembers(viewValue);
      };
    }
  };
}
