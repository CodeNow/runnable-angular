'use strict';

require('app').directive('planStatusForm', planStatusForm);

function planStatusForm(
  billingPlans,
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'planStatusForm',
    controller: 'PlanStatusFormController as PSFC',
    link: function ($scope, element) {
      /**
       * Get the classes for the meter
       * @returns {Object} - Object with keys of class names and true/false for if they should be enabled
       */
      $scope.getMeterClass = function () {
        var classes = {};
        if ($scope.PSFC.configurations) {
          classes['used-' + $scope.PSFC.configurations] = true;
        }
        if (keypather.get($scope, 'preview.length')) {
          classes['preview-used-' + billingPlans[$scope.preview].maxConfigurations] = true;
        }
        return classes;
      };
    }
  };
}
