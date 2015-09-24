'use strict';

require('app')
  .directive('internalModalHelper', internalModalHelper);

function internalModalHelper(
  ModalService
) {
  return {
    restrict: 'A',
    link: function ($scope, element, attrs) {
      angular.element(element[0]).on('click', function () {
        ModalService.showModal({
          controller: 'ConfirmationModalController',
          controllerAs: 'CMC',
          templateUrl: attrs.internalModalHelper
        });
      });
    }
  };
}