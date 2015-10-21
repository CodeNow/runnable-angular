'use strict';

describe('fetchStackAnalysisService'.bold.underline.blue, function () {
  var apiClientBridge;
  var fetchStackAnalysis;
  var $q;
  var $rootScope;
  function initState() {

    angular.mock.module('app');

    angular.mock.inject(function (_fetchStackAnalysis_, _$q_, _$rootScope_, _apiClientBridge_) {
      apiClientBridge = _apiClientBridge_;
      fetchStackAnalysis = _fetchStackAnalysis_;
      $q = _$q_;
      $rootScope = _$rootScope_;
    });
  }
  beforeEach(initState);

  it('should return the first value it gets', function (done) {
    var value = {
      hello: 'hi'
    };
    var value2 = {
      hello2: 'hi2'
    };
    sinon.stub(apiClientBridge.client, 'pGet').returns($q.when(value));
    fetchStackAnalysis('sadfsdf')
      .then(function (result) {
        expect(result, '1st').to.equal(value);
        apiClientBridge.client.pGet.returns($q.when(value2));
        return fetchStackAnalysis('sadfsdf');
      })
      .then(function (result) {
        expect(result, '2nd').to.equal(value);
        expect(result, '2nd').to.not.equal(value2);
        done();
      });
    $rootScope.$digest();
  });
  it('should throw a catch on an error', function (done) {
    var error = new Error('Hey');
    sinon.stub(apiClientBridge.client, 'pGet').returns($q.reject(error));
    fetchStackAnalysis('sadfsdf')
      .then(function () {
        done(new Error('NO, shouldnt have come here!'));
      })
      .catch(function (err) {
        expect(err, 'err').to.equal(error);
        done();
      });
    $rootScope.$digest();
  });
});
