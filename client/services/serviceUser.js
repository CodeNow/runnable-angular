'use strict';

var Runnable = require('runnable');
var qs = require('qs');

require('app')
  .factory('user', function ($http, configAPIHost, configUserContentDomain) {
    var runnable = new Runnable(configAPIHost, { userContentDomain: configUserContentDomain, socket: true });
    runnable.client.request = new AngularHttpRequest($http);
    return runnable;
  });

var methods = ['get', 'post', 'patch', 'del', 'put'];
var bodyMethods = ['post', 'patch', 'del'];
var methodAliases = {
  del: 'delete'
};

var AngularHttpRequest = function AngularHttpRequest($http) {
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
    if (opts.qs) {
      opts.url += '?' + qs.stringify(opts.qs);
    }
    delete opts.qs;
    opts.cache = false;

    this.$http(opts)
      .success(callback)
      .error(callback);

    function callback(data, status, headers, config) {
      if (status === 0) {
        // CORS failed
        return cb(new Error('Could not reach server'));
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
