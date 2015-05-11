'use strict';
require('app')
  .factory('assign', function () {
    return require('101/assign');
  })
  .factory('callbackCount', function () {
    return require('callback-count');
  })
  .factory('debounce', function () {
    return require('debounce');
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
  .factory('moment', function () {
    return require('moment');
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
  .value('modelStore', require('runnable/lib/stores/model-store'))
  .value('collectionStore', require('runnable/lib/stores/collection-store'));
