'use strict';

require('app').directive('chooseStackType', chooseStackType);

function chooseStackType() {
  return {
    restrict: 'A',
    controller: 'ChooseStackTypeController',
    controllerAs: 'CSTC',
    templateUrl: 'chooseStackTypeView',
    bindToController: true,
    scope: {
      targetOrg: '=',
      createDock: '='
    },
    link: function ($scope) {
      $scope.stacks = [
        {
          displayName: 'node.js',
          icon: '/build/images/logos/logo-icon-nodejs.svg',
          id: 'nodejs',
          repo: 'node-web'
        },
        {
          displayName: 'Python',
          icon: '/build/images/logos/logo-icon-python.svg',
          id: 'python',
          repo: 'node-web',
          disabled: true
        },
        {
          displayName: 'Ruby',
          icon: '/build/images/logos/logo-icon-ruby.svg',
          id: 'ruby',
          repo: 'node-web',
          disabled: true
        },
        {
          displayName: 'Rails',
          icon: '/build/images/logos/logo-icon-rails.svg',
          id: 'rails',
          repo: 'node-web',
          disabled: true
        },
        {
          displayName: 'Go',
          icon: '/build/images/logos/logo-icon-go.svg',
          id: 'go',
          repo: 'node-web',
          disabled: true
        }
      ];
    }
  };
}
