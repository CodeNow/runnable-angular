'use strict';

require('app')
  .factory('configLogoutURL', configLogoutURL);
/**
 * @ngInject
 */
function configLogoutURL(
  $window,
  configAPIHost
) {
  return function () {
    var redirect = encodeURI($window.location.protocol + '//' + $window.location.host);
    return configAPIHost + '/auth/logout?redirect=' + redirect;
  };
}
