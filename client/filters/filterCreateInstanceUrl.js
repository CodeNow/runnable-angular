'use strict';

require('app')
  .filter('filterCreateInstanceUrl', function filterCreateInstanceUrl(configUserContentDomain) {
    return function (name, activeAccount) {
      return activeAccount ?
          name + '-' + activeAccount.oauthName() + '.' + configUserContentDomain : null;
    };
  });
