'use strict';
require('app')
  .factory('assign', function () {
    return require('101/assign');
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
  .factory('base64', function () {
    return require('js-base64').Base64;
  })
  .factory('streamBuffers', function () {
    return require('stream-buffers');
  })
  .factory('Termjs', function () {
    return require('term.js');
  })
  .factory('through', function () {
    return require('through');
  })
  .factory('diffParse', function () {
    return require('diff-parse');
  })
  .factory('memoize', function () {
    return require('lodash/memoize');
  })
  .factory('throttle', function () {
    return require('lodash/throttle');
  })
  .factory('jsYaml', function () {
    return require('js-yaml');
  })
  .factory('cardInfoTypes', function () {
    var types = require('card-info-types');
    // Legacy
    types['Main Repository'] = types.MainRepository;
    types['SSH Key'] = types.SSHKey;
    return types;
  })
  .factory('pointInPolygon', function () {
    return require('point-in-polygon');
  })
  .service('keypather', [require('keypather')])
  .service('uuid', function () {
    return require('node-uuid');
  })
  .service('jsonHash', function (){
    return require('json-hash');
  })
  .value('modelStore', require('@runnable/api-client/lib/stores/model-store'))
  .value('collectionStore', require('@runnable/api-client/lib/stores/collection-store'));
