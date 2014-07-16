module.exports = QueryAssist;
function QueryAssist(){}
QueryAssist.prototype.wrapFunc = function (wrapFunc) {
  this.wrapFunc = wrapFunc;
  return this;
};
QueryAssist.prototype.props = function (props) {
  this.props = props;
  return this;
};
QueryAssist.prototype.cacheHitCb = function (cacheHitCb) {
  this.cacheHitCb = cacheHitCb;
  return this;
};
QueryAssist.prototype.cb = function (cb) {
  this.cb = cb;
  return this;
};
QueryAssist.prototype.go = function () {
  return QueryAssist.exec(this.wrapFunc, this.props, this.cacheHitCb, this.cb);
};
QueryAssist.exec = function(wrapFunc, props, cacheHitCb, cb) {
  var modelOrColl = wrapFunc(props, function () {
    cacheHitCb();
    cb.call(arguments);
  });
  if (Array.isArray(modelOrColl.models)) {
    if(modelOrColl.models.length) {
      cacheHitCb.call();
    }
  } else {
    if(Object.keys(modelOrColl.attrs).length > 1) {
      cacheHitCb.call();
    }
  }
  return modelOrColl;
};
