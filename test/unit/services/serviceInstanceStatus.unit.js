'use strict';

describe('serviceInstanceStatus', function () {
  var serviceInstanceStatus;
  var keypather;
  beforeEach(function() {
    angular.mock.module('app');
    // Needs to have 'Filter' on the end to be properly injected
    angular.mock.inject(function(_serviceInstanceStatus_, _keypather_) {
      serviceInstanceStatus = _serviceInstanceStatus_;
      keypather = _keypather_;
    });
  });

  describe('running instance', function () {
    var instance;
    beforeEach(function () {
      instance = {};
      keypather.set(instance, 'containers.models[0].running', function (){return true;});
    });
    it('returns crashed', function() {
      expect(serviceInstanceStatus(instance)).to.equal('running');
    });
  });

  describe('crashed instance', function () {
    var instance;
    beforeEach(function () {
      instance = {};
      keypather.set(instance, 'containers.models[0].running', function (){return false;});
    });
    it('returns crashed', function() {
      expect(serviceInstanceStatus(instance)).to.equal('crashed');
    });
  });

  describe('stopped instance', function () {
    var instance;
    beforeEach(function () {
      instance = {};
      keypather.set(instance, 'containers.models[0].running', function (){return false;});
      keypather.set(instance, 'containers.models[0].attrs.inspect.State.ExitCode', -1);
    });
    it('returns stopped', function() {
      expect(serviceInstanceStatus(instance)).to.equal('stopped');
    });

  });

  describe('failed build instance', function () {
    var instance;
    beforeEach(function () {
      instance = {};
      keypather.set(instance, 'build.failed', function (){return true;});
    });
    it('returns Build Failed', function () {
      expect(serviceInstanceStatus(instance)).to.equal('buildFailed');
    });
  });

  describe('building instance', function () {
    var instance;
    beforeEach(function () {
      instance = {};
      keypather.set(instance, 'build.failed', function (){return false;});
    });
    it('returns Building', function() {
      expect(serviceInstanceStatus(instance)).to.equal('building');
    });
  });

  describe('unknown status', function () {
    var instance;
    beforeEach(function () {
      instance = {};
    });
    it('returns Building', function() {
      expect(serviceInstanceStatus(instance)).to.equal('unknown');
    });
  });

});
