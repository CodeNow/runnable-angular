/**
 * Here for legacy support of serviceUser.js (runnable)
 */

require('app')
  .value('apiConfigHost', require('config/api').host);
