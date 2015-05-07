'use strict';

describe('filterCardBuildStatusTitle', function () {
  var filterCardBuildStatusTitle;
  var keypather;
  beforeEach(function() {
    angular.mock.module('app');
    // Needs to have 'Filter' on the end to be properly injected
    angular.mock.inject(function(_cardBuildStatusTitleFilter_, _keypather_) {
      filterCardBuildStatusTitle = _cardBuildStatusTitleFilter_;
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
      expect(filterCardBuildStatusTitle(instance)).to.equal('Crashed a few seconds ago');
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
      expect(filterCardBuildStatusTitle(instance)).to.equal('Stopped a few seconds ago');
    });
  });


  describe('failed build instance', function () {
    var instance;
    beforeEach(function () {
      instance = {};
      keypather.set(instance, 'build.failed', function (){return true;});
    });
    it('returns Build Failed', function () {
      expect(filterCardBuildStatusTitle(instance)).to.equal('Failed a few seconds ago');
    });
  });

  describe('building instance', function () {
    var instance;
    beforeEach(function () {
      instance = {};
      keypather.set(instance, 'build.failed', function (){return false;});
    });
    it('returns Building', function() {
      expect(filterCardBuildStatusTitle(instance)).to.equal('Building for a few seconds');
    });
  });

});
