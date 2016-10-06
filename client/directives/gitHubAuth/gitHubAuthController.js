'use strict';

require('app')
  .controller('GitHubAuthController', GitHubAuthController);

function GitHubAuthController(
  $rootScope,
  keypather
) {
  keypather.set($rootScope, 'dataApp', {});
}
