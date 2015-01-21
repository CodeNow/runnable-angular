'use strict';

require('app')
  .directive('checkCommitOrBranch', checkCommitOrBranch);
/**
 * checkCommitOrBranch Directive
 * @ngInject
 */
function checkCommitOrBranch(
  $rootScope,
  debounce
) {
  return {
    restrict: 'A',
    require: 'ngModel',
    scope: {
      repoModel: '=checkCommitOrBranch'
    },
    link: function ($scope, element, attrs, ctrl) {
      ctrl.$setValidity('commitFound', false);
      var repo = $scope.repoModel;

      var checkValid = debounce(function (branchOrCommit) {
        if (!branchOrCommit || ctrl.$pristine) {
          ctrl.$setValidity('commitFound', true);
          return branchOrCommit;
        }
        if (isBranch(branchOrCommit)) {
          repo.selectedBranch = branchOrCommit;
          ctrl.$setValidity('commitFound', true); // valid
          return;
        }

        repo.fetchCommit(branchOrCommit, function (err) {
          if (err) {
            ctrl.$setValidity('commitFound', false); // invalid
          } else {
            ctrl.$setValidity('commitFound', true); // valid
          }
        });

        function isBranch(name) {
          return repo.branches.models.some(function (branch) {
            return branch.attrs.name === name;
          });
        }
      });

      // called when value changes via code/controller
      ctrl.$formatters.unshift(checkValid);
      // called when value changes in input element
      ctrl.$parsers.unshift(checkValid);
    }
  };
}
