'use strict';

describe.only('loading'.bold.underline.blue, function () {
  var loading;
  var $rootScope;
  function initState () {

    angular.mock.module('app');

    angular.mock.inject(function (_loading_, _$rootScope_) {
      loading = _loading_;
      $rootScope = _$rootScope_;
    });
  }
  beforeEach(initState);

  it('should not have an identity crisis', function () {
    expect(loading).to.be.a('function');
    expect(loading.reset).to.be.a('function');
  });
  describe('basic operations'.bold, function () {
    it('should set loading, then unset when finished', function () {
      expect($rootScope.isLoading.hello).to.not.be.ok;
      loading('hello', true);
      expect($rootScope.isLoading.hello).to.be.true;
      loading('hello', false);
      expect($rootScope.isLoading.hello).to.be.false;
    });
    it('namespaces should not interact with each other', function () {
      expect($rootScope.isLoading.hello).to.not.be.ok;
      expect($rootScope.isLoading.cheese).to.not.be.ok;
      loading('hello', true);
      expect($rootScope.isLoading.hello).to.be.true;
      expect($rootScope.isLoading.cheese).to.not.be.ok;
      loading('cheese', true);
      expect($rootScope.isLoading.hello).to.be.true;
      expect($rootScope.isLoading.cheese).to.be.true;
      loading('hello', false);
      expect($rootScope.isLoading.hello).to.be.false;
      expect($rootScope.isLoading.cheese).to.be.true;
      loading('cheese', false);
      expect($rootScope.isLoading.hello).to.be.false;
      expect($rootScope.isLoading.cheese).to.be.false;
    });
    it('When two things load, it should take 2 finishes', function () {
      expect($rootScope.isLoading.hello).to.not.be.ok;
      loading('hello', true);
      expect($rootScope.isLoading.hello).to.be.true;
      loading('hello', true);
      expect($rootScope.isLoading.hello).to.be.true;
      loading('hello', false);
      expect($rootScope.isLoading.hello).to.be.true;
      loading('hello', false);
      expect($rootScope.isLoading.hello).to.be.false;
    });
    it('reset should reset that namespace', function () {
      expect($rootScope.isLoading.hello).to.not.be.ok;
      expect($rootScope.isLoading.cheese).to.not.be.ok;
      loading('hello', true);
      expect($rootScope.isLoading.hello).to.be.true;
      expect($rootScope.isLoading.cheese).to.not.be.ok;
      loading('cheese', true);
      loading.reset('hello');
      expect($rootScope.isLoading.hello).to.be.false;
      expect($rootScope.isLoading.cheese).to.be.true;
      loading('hello', true);
      expect($rootScope.isLoading.hello).to.be.true;
      expect($rootScope.isLoading.cheese).to.be.true;
      loading('hello', false);
      expect($rootScope.isLoading.hello).to.be.false;
      expect($rootScope.isLoading.cheese).to.be.true;
      loading('cheese', false);
      expect($rootScope.isLoading.hello).to.be.false;
      expect($rootScope.isLoading.cheese).to.be.false;
    });
  });
});
