'use strict';

require('app')
  .controller('PopOverController', PopOverController);

function PopOverController(
  $rootScope,
  $scope,
  $document,
  $templateCache,
  $compile,
  $timeout,
  exists
) {
  var POC = this;
  POC.unbindDocumentClick = angular.noop;
  POC.unbindPopoverOpened = angular.noop;
  POC.unbindSpecificPopoverOpened = angular.noop;

  POC.isPopoverActive = function () {
    return $scope.active;
  };
  POC.closePopover = function () {
    // trigger a digest because we are setting active to false!
    $timeout(angular.noop);
    $scope.active = false;
    POC.unbindDocumentClick();
    POC.unbindPopoverOpened();
    POC.unbindSpecificPopoverOpened();
    $rootScope.$broadcast('popover-closed', {
      template: $scope.template,
      data: $scope.data
    });
    // We need a closure because they could technically re-open the popover and we want to manage THIS scope and THIS element.
    (function (popoverElementScope, popoverElement) {
      //Give the transition some time to finish!
      $timeout(function () {
        if (popoverElement) {
          popoverElement.remove();
        }
        if (popoverElementScope) {
          popoverElementScope.$destroy();
        }
      }, 500);
    }(POC.popoverElementScope, POC.popoverElement));
  };
  POC.openPopover = function () {
    $rootScope.$broadcast('popover-opened', {
      template: $scope.template,
      data: $scope.data
    });
    $scope.popoverOptions = $scope.popoverOptions || {};

    if (!exists($scope.popoverOptions.top) && !exists($scope.popoverOptions.bottom)) {
      $scope.popoverOptions.top = 0;
    }
    if (!exists($scope.popoverOptions.left) && !exists($scope.popoverOptions.right)) {
      $scope.popoverOptions.left = 0;
    }

    $rootScope.$broadcast('close-popovers');

    $timeout(function () {
      // If the click has no target we should close the popover.
      // If the click has a target and that target is on the page but not on our popover we should close the popover.
      // Otherwise we should keep the popover alive.
      POC.unbindDocumentClick = $scope.$on('app-document-click', function (event, target) {
        if (!$scope.userCannotClose && (!target || (target && $document[0].contains(target) && !POC.popoverElement[0].contains(target)))) {
          POC.closePopover();
        }
      });
    }, 0);
    POC.unbindPopoverOpened = $scope.$on('close-popovers', function (event, closeAllPopoversOverride) {
      if (!$scope.userCannotClose || closeAllPopoversOverride) {
        POC.closePopover();
      }
    });
    POC.unbindSpecificPopoverOpened = $scope.$on('close-open-state-popover', function (event, popoverName) {
      if ($scope.data && $scope.data.popoverName === popoverName) {
        POC.closePopover();
      }
    });

    var template = $templateCache.get($scope.template);

    // We need to create a custom scope so we can call $destroy on it when the element is removed.
    POC.popoverElementScope = $scope.$new();
    // Temporary workaround until I create a PR for angular to not have a nonsense error
    //   Error: [jqLite:nosel] Looking up elements via selectors is not supported by jqLite!
    // Not terribly descriptive, guys.
    // https://github.com/angular/angular.js/pull/11688
    if (!template) {
      throw new Error('Popover template not found: ' + $scope.template);
    }
    POC.popoverElement = $compile(template)(POC.popoverElementScope);
    $document.find('body').append(POC.popoverElement);
    // Trigger a digest cycle
    $scope.active = true;
    $scope.$evalAsync();
  };
}
