function QueryAssist(modelOrColl, asyncCB){
  this.modelOrColl = modelOrColl;
  this.asyncCB = asyncCB;

  var asyncCalled = false;
  this.asyncCB = function () {
    if (asyncCalled) {
      return;
    }
    asyncCalled = true;
    asyncCB();
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

QueryAssist.exec = function() {
  var _this = this;
  var modelOrColl = this.modelOrColl[this.wrapFunc](this.query, function (err) {
    if (!err) {
      _this.cacheFetch(modelOrColl, false, _this.asyncCB);
    }
    // cb.call(arguments);
    _this.resolve(err, modelOrColl, _this.asyncCB);
  });
  if (Array.isArray(modelOrColl.models)) {
    if(modelOrColl.models.length) {
      this.cacheFetch(modelOrColl, true, this.asyncCB);
    }
  } else {
    if(Object.keys(modelOrColl.attrs).length > 1) {
      this.cacheFetch(modelOrColl, true, this.asyncCB);
    }
  }
  return modelOrColl;
};

module.exports = QueryAssist;
