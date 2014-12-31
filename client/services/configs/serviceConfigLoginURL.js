require('app')
  .factory('configLoginURL', configLoginURL);
/**
 * @ngInject
 */
function configLoginURL(
  $window,
  configAPIHost
) {
  return function () {
    var redirect = encodeURI($window.location.protocol + '//' + $window.location.host + '/?auth');
    return configAPIHost + '/auth/github?redirect=' + redirect;
  };
}
