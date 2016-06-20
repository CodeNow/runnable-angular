'use strict';

describe('filterCardBuildStatusTitle', function () {
  var filterCardBuildStatusTitle;
  beforeEach(function() {
    angular.mock.module('app');
    // Needs to have 'Filter' on the end to be properly injected
    angular.mock.inject(function(_cardBuildStatusTitleFilter_) {
      filterCardBuildStatusTitle = _cardBuildStatusTitleFilter_;
    });
  });

  describe('if testing', function () {
    var instance;
    beforeEach(function () {
      instance = {
        attrs: {
          isTesting: true
        },
        status: sinon.stub()
      };
    });
    it('when stopped should report tests passed', function () {
      instance.status.returns('stopped');
      expect(filterCardBuildStatusTitle(instance)).to.equal('Passed a few seconds ago');
    });
    it('when crashed should report tests failed', function () {
      instance.status.returns('stopped');
      expect(filterCardBuildStatusTitle(instance)).to.equal('Failed a few seconds ago');
    });
    it('when running should report tests running', function () {
      instance.status.returns('running');
      expect(filterCardBuildStatusTitle(instance)).to.equal('Testing for a few seconds');
    });
  });

  describe('if not testing', function () {
    var instance;
    beforeEach(function () {
      instance = {
        status: sinon.stub()
      };
    });
    it('with a crashed instance returns crashed', function() {
      instance.status.returns('crashed');
      expect(filterCardBuildStatusTitle(instance)).to.equal('Crashed a few seconds ago');
    });
    it('with a stopped instance returns stopped', function() {
      instance.status.returns('stopped');
      expect(filterCardBuildStatusTitle(instance)).to.equal('Stopped a few seconds ago');
    });
    it('with a running instance returns running', function() {
      instance.status.returns('running');
      expect(filterCardBuildStatusTitle(instance)).to.equal('Running for a few seconds');
    });
    it('with a buildFailed instance returns build failed', function() {
      instance.status.returns('buildFailed');
      expect(filterCardBuildStatusTitle(instance)).to.equal('Failed a few seconds ago');
    });
    it('with building instance returns building', function () {
      instance.status.returns('building');
      expect(filterCardBuildStatusTitle(instance)).to.equal('Building for a few seconds');
    });
    it('with neverStarted instance returns failed', function () {
      instance.status.returns('neverStarted');
      expect(filterCardBuildStatusTitle(instance)).to.equal('Failed a few seconds ago');
    });
  });
});
