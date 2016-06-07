'use strict';

require('app')
  .directive('containerFiles', containerFilesDirective);

function containerFilesDirective() {
  return {
    restrict: 'A',
    templateUrl: 'viewFormFiles',
    controller: 'ContainerFilesController',
    controllerAs: 'CFC',
    bindToController: true,
    scope: {
      getDisplayName: '=',
      state: '='
    }
  };
}


