'use strict';

describe('filteCardbuildStatusText', function () {
  var filterCardBuildStatusText;
  var keypather;
  beforeEach(function() {
    angular.mock.module('app');
    // Needs to have 'Filter' on the end to be properly injected
    angular.mock.inject(function(_cardBuildStatusTextFilter_, _keypather_) {
      filterCardBuildStatusText = _cardBuildStatusTextFilter_;
      keypather = _keypather_;
    });
  });

  describe('crashed instance', function () {
    var instance;
    beforeEach(function () {
      instance = {};
      keypather.set(instance, 'containers.models[0].running', function (){return false;});
    });
    it('returns crashed', function() {
      expect(filterCardBuildStatusText(instance)).to.equal('Crashed');
    });

    it('prepends a dash when set', function() {
      expect(filterCardBuildStatusText(instance, true)).to.equal('— Crashed');
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
      expect(filterCardBuildStatusText(instance)).to.equal('Stopped');
    });

    it('prepends a dash when set', function() {
      expect(filterCardBuildStatusText(instance, true)).to.equal('— Stopped');
    });
  });


  describe('failed build instance', function () {
    var instance;
    beforeEach(function () {
      instance = {};
      keypather.set(instance, 'build.failed', function (){return true;});
    });
    it('returns Build Failed', function () {
      expect(filterCardBuildStatusText(instance)).to.equal('Build Failed');
    });

    it('prepends a dash when set', function () {
      expect(filterCardBuildStatusText(instance, true)).to.equal('— Build Failed');
    });
  });

  describe('building instance', function () {
    var instance;
    beforeEach(function () {
      instance = {};
      keypather.set(instance, 'build.failed', function (){return false;});
    });
    it('returns Building', function() {
      expect(filterCardBuildStatusText(instance)).to.equal('Building');
    });

    it('prepends a dash when set', function() {
      expect(filterCardBuildStatusText(instance, true)).to.equal('— Building');
    });
  });

});
