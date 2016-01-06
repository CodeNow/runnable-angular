'use strict';

var Runnable = require('runnable');
var qs = require('qs');
require('app')
  .factory('apiClientBridge', function (
    $http,
    $q,
    configAPIHost,
    configUserContentDomain,
    modelStore,
    collectionStore,
    $timeout,
    debounce,
    report
  ) {
    var runnable = new Runnable(configAPIHost, { userContentDomain: configUserContentDomain });
    runnable.client.request = new AngularHttpRequest($http, report.error);
    runnable.client.getAsync = $q.promisify(runnable.client.get, runnable.client);
    // We need to debounce here because we could get a lot of messages from the socket and we don't want to refresh constantly
    var triggerDigest = debounce(function () {
      $timeout(angular.noop);
    }, 100);

    modelStore.on('model:update:socket', triggerDigest);
    collectionStore.on('collection:update:socket', triggerDigest);

    return runnable;
  });

var methods = ['get', 'post', 'patch', 'del', 'put'];
var bodyMethods = ['post', 'patch', 'del'];
var methodAliases = {
  del: 'delete'
};

var AngularHttpRequest = function AngularHttpRequest(
  $http,
  report
) {
  this.report = report;
  this.$http = $http;
};

AngularHttpRequest.prototype.defaults = function (opts) {
  this.defautOpts = opts;
};

methods.forEach(function (method) {
  AngularHttpRequest.prototype[method] = function () {
    var args = (~bodyMethods.indexOf(method)) ?
      this._formatBodyArgs(arguments) :
      this._formatQueryArgs(arguments);

    var opts = args.opts;
    opts = angular.extend({}, opts, this.defaultOpts);
    var cb = args.cb;
    opts.method = methodAliases[method] || method;
    opts.data = opts.json || opts.body;
    delete opts.json;
    delete opts.body;
    if (opts.qs && qs.stringify(opts.qs)) {
      opts.url += '?' + qs.stringify(opts.qs);
    }
    delete opts.qs;
    opts.cache = false;

    // Both use the same callback as api-client handles the errors
    this.$http(opts)
      .success(callback)
      .error(callback);

    var self = this;

    function callback(data, status, headers, config) {
      if (typeof cb !== 'function') {
        self.report.error('Callback defined but not a function. \nType: ' + typeof cb + ' \nJSON: '  + JSON.stringify(cb, false, 2), {
          emitter: 'Manual',
          source: 'client/services/serviceUser.js'
        });
        cb = angular.noop;
      }

      if (status === 0) {
        // CORS failed
        return cb(new Error('Could not reach server URL: ' + opts.url));
      }
      var body = data;
      var res = {
        body: body,
        statusCode: status,
        headers: headers
      };
      cb(null, res, body);
    }
  };
});

AngularHttpRequest.prototype._formatArgs = function (args) {
  var url = args[0];
  var opts = args[1];
  var cb = args[2];

  if (angular.isFunction(url)) {
    cb = url;
    opts = null;
    url = null;
  } else if (angular.isObject(url)) {
    cb = opts;
    opts = url;
    url = null;
  } else if (angular.isFunction(opts)) {
    cb = opts;
    opts = null;
  } else {}

  opts.url = opts.url || opts.uri;

  return {
    url: url,
    opts: opts,
    cb: cb
  };
};

AngularHttpRequest.prototype._formatBodyArgs = function (args) {
  args = this._formatArgs(args);
  if (args.url) {
    // assume opts is body if doesnt look like opts
    if (!args.opts.url && !args.opts.json && !args.opts.qs) {
      args.opts = {
        json: args.opts
      };
    }
  }
  args.opts.url = args.url || args.opts.url;
  return args;
};


AngularHttpRequest.prototype._formatQueryArgs = function (args) {
  args = this._formatArgs(args);
  if (args.url) {
    // assume opts is query if doesnt look like opts
    if (!args.opts.url && !args.opts.json && !args.opts.qs) {
      args.opts = {
        qs: args.opts
      };
    }
  }
  args.opts.url = args.url || args.opts.url;
  return args;
};
