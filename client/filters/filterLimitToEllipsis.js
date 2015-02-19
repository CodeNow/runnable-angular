'use strict';

require('app')
  .filter('limitToEllipsis', limitToEllipsis);

function limitToEllipsis() {
  return function(str, charLimit) {
    if (!str) { return; }
    if (!charLimit || str.length <= charLimit) { return str; }
    return str.slice(0, charLimit).trim() + '…';
  };
}