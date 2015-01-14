'use strict';

require('app')
  .factory('QueryAssist', function () {

    function QueryAssist(modelOrColl, asyncCB) {
      var asyncCalled = false;
      this.modelOrColl = modelOrColl;
      this.asyncCB = function () {
        if (asyncCalled) {
          return;
        }
        asyncCalled = true;
        if (angular.isFunction(asyncCB)) {
          asyncCB.apply(this, arguments);
        }
      };
      return this;
    }

    QueryAssist.prototype.wrapFunc = function (wrapFunc) {
      this.wrapFunc = wrapFunc;
      return this;
    };

    QueryAssist.prototype.query = function (query) {
      this.query = query;
      return this;
    };

    QueryAssist.prototype.cacheFetch = function (cacheFetch) {
      this.cacheFetch = cacheFetch;
      return this;
    };

    QueryAssist.prototype.resolve = function (resolve) {
      this.resolve = resolve;
      return this;
    };

    QueryAssist.prototype.go = function () {
      return QueryAssist.exec.call(this);
    };

    QueryAssist.exec = function () {
      var _this = this;
      var modelOrColl;
      if (this.hasOwnProperty('query')) {
        modelOrColl = this.modelOrColl[this.wrapFunc](this.query, asyncAPIComplete);
      } else {
        modelOrColl = this.modelOrColl[this.wrapFunc](asyncAPIComplete);
      }

      function asyncAPIComplete(err) {
        if (!err) {
          _this.cacheFetch(modelOrColl, false, _this.asyncCB);
        }
        // cb.call(arguments);
        _this.resolve(err, modelOrColl, _this.asyncCB);
      }

      if (Array.isArray(modelOrColl.models)) {
        if (modelOrColl.models.length) {
          this.cacheFetch(modelOrColl, true, this.asyncCB);
        }
      } else {
        if (Object.keys(modelOrColl.attrs).length > 1) {
          this.cacheFetch(modelOrColl, true, this.asyncCB);
        }
      }
      return modelOrColl;
    };

    return QueryAssist;
  });
