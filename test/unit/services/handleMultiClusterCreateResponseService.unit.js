'use strict';

describe('handleMultiClusterCreateResponse'.bold.underline.blue, function () {
  var $scope;
  var $rootScope;
  var $controller;
  var handleMultiClusterCreateResponse;
  var handleSocketEventStub;
  var results;
  var badResults;
  var response;
  var badResponse;
  var hashes = ['dfasdfasdf', 'asdfasdfsadf', 'asdfasdfasdfsd'];
  var socketResponse = [{
    clusterName: hashes[0]
  }, {
    clusterName: hashes[1]
  }, {
    clusterName: hashes[2]
  }];
  describe('base', function () {
    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('handleMultiSocketEvent', function ($q) {
          handleSocketEventStub = sinon.stub().returns($q.when(socketResponse[0]));
          handleSocketEventStub.onFirstCall().returns($q.when(socketResponse[0]));
          handleSocketEventStub.onSecondCall().returns($q.when(socketResponse[1]));
          handleSocketEventStub.onThirdCall().returns($q.when(socketResponse[2]));
          return handleSocketEventStub;
        });

      });
      results = {
        externals: [{ hash: hashes[0] }, { hash: hashes[1] }],
        builds: [{ hash: hashes[2] }]
      };
      badResults = {
        externals: [{ hash: hashes[0] }, { hash: hashes[1] }],
        builds: [{ hash: hashes[2] }, { hash: 'asdasfdasdfasfaeefee' }]
      };
      response = {
        data: {
          created: results
        }
      };
      badResponse = {
        data: {
          created: badResults
        }
      };

      angular.mock.inject(function (
        _$controller_,
        _$rootScope_,
        _handleMultiClusterCreateResponse_
      ) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        handleMultiClusterCreateResponse = _handleMultiClusterCreateResponse_;
      });
      $scope.$digest();
    });


    it('should resolve if no results given', function (done) {
      handleMultiClusterCreateResponse()
        .then(done);
      $scope.$digest();
    });
    it('should resolve if all the hashes were accounted for', function (done) {
      handleMultiClusterCreateResponse(response)
        .then(done);
      $scope.$digest();
    });
    it('should throw an error if all the hashes were not accounted for', function (done) {
      handleMultiClusterCreateResponse(badResponse)
        .then(function () {
          done(new Error('Should have called catch'));
        })
        .catch(function (err) {
          expect(err.message).to.equal('Not all of the requested repositories could be created.');
          done();
        });
      $scope.$digest();
    });
  });
});
