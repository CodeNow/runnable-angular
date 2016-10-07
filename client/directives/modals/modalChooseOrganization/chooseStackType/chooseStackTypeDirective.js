'use strict';

require('app').directive('chooseStackType', chooseStackType);

function chooseStackType() {
  return {
    restrict: 'A',
    controller: 'ChooseStackTypeController',
    controllerAs: 'CSTC',
    templateUrl: 'chooseStackTypeView',
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
          repo: 'rails-app'
        },
        {
          displayName: 'Ruby',
          icon: '/build/images/logos/logo-icon-ruby.svg',
          id: 'ruby',
          repo: 'ruby-app'
        },
        {
          displayName: 'Rails',
          icon: '/build/images/logos/logo-icon-rails.svg',
          id: 'rails',
          repo: 'rails-app'
        },
        {
          displayName: 'Go',
          icon: '/build/images/logos/logo-icon-go.svg',
          id: 'go',
          repo: 'go-app'
        }
      ];
    }
  };
}
