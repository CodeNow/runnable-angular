'use strict';

require('app')
  .controller('GithubAuthController', GithubAuthController);

function GithubAuthController(
  $rootScope,
  keypather
) {
  keypather.set($rootScope, 'dataApp', {});
}
