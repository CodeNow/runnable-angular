var mockResponses = {};
var shouldFailMap = {};
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
module.exports = QueryAssist;
// static method for mocking
module.exports.setMock = function (factoryMethodName, functionOrObj, errorMessage) {
  mockResponses[factoryMethodName] = functionOrObj;
  if (errorMessage) {
    shouldFailMap[factoryMethodName] = errorMessage;
  }
};
module.exports.clearMocks = function () {
  mockResponses = {};
  shouldFailMap = {};
};
// instance methods
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
  if (!mockResponses[this.wrapFunc]) { throw new Error('no mock for ' + this.wrapFunc); }

  var mockedData = (typeof mockResponses[this.wrapFunc] === 'function') ?
    mockResponses[this.wrapFunc]() : mockResponses[this.wrapFunc];
  // cb.call(arguments);
  if (shouldFailMap[this.wrapFunc]) {
    this.resolve(new Error(shouldFailMap[this.wrapFunc]), mockedData, this.asyncCB);
  } else {
    this.cacheFetch(mockedData, true, this.asyncCB);
  }
  return mockedData;
};