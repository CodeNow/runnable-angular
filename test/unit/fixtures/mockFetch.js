var fetches = {};
var q;

var mockFetcher = {};

mockFetcher.expectFetch = function (type, opts, result) {
  fetches[type] = result;
}

mockFetcher.init = function ($q) {
  q = $q;
}

mockFetcher.fetch = function  (type, opts) {
  // TODO: opts
  if (fetches[type]) {
    return q.when(fetches[type]);
  }
  throw new Error('Unexpected fetch of type: ', type, opts);
}

module.exports = mockFetcher;