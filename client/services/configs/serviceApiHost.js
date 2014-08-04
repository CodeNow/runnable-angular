/**
 * Here for legacy support of serviceUser.js (runnable)
 */

require('app')
  .value('apiHost', require('config/api').host);
