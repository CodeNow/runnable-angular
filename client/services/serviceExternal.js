'use strict';
require('app')
  .factory('callbackCount', function () {
    return require('callback-count');
  })
  .factory('debounce', function () {
    return require('debounce');
  })
  .factory('equals', function () {
    return require('101/equals');
  })
  .factory('exists', function () {
    return require('101/exists');
  })
  .factory('favicojs', function () {
    return require('favico.js');
  })
  .factory('hasKeypaths', function () {
    return require('101/has-keypaths');
  })
  .factory('hasProps', function () {
    return require('101/has-properties');
  })
  .factory('isFunction', function () {
    return require('101/is-function');
  })
  .factory('moment', function () {
    return require('moment');
  })
  .factory('pick', function () {
    return require('101/pick');
  })
  .factory('pluck', function () {
    return require('101/pluck');
  })
  .factory('regexpQuote', function () {
    return require('regexp-quote');
  })
  .factory('dockerStreamCleanser', function () {
    return require('docker-stream-cleanser');
  })
  .factory('Termjs', function () {
    return require('term.js');
  })
  .factory('through', function () {
    return require('through');
  })
  .factory('validateDockerfile', function () {
    return require('validate-dockerfile');
  })
  .service('keypather', [require('keypather')])
  .service('uuid', function () {
    return require('node-uuid');
  })
  .value('modelStore', require('runnable/lib/stores/model-store'));
