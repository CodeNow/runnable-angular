'use strict';

require('app')
  .factory('configLoginURL', configLoginURL);
/**
 * @ngInject
 */
function configLoginURL(
  $window,
  configAPIHost
) {
  return function (demo) {
    var redirect = encodeURI($window.location.protocol + '//' + $window.location.host);
    if (demo) {
      redirect += '/demo/fork';
    } else {
      redirect += '/?auth';
    }
    return configAPIHost + '/auth/github?redirect=' + redirect;
  };
}
