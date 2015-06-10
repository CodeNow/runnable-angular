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
      instance = {
        status: function () {
          return 'crashed';
        }
      };
    });
    it('returns crashed', function() {
      expect(filterCardBuildStatusTitle(instance)).to.equal('Crashed a few seconds ago');
    });
  });


  describe('stopped instance', function () {
    var instance;
    beforeEach(function () {
      instance = {
        status: function () {
          return 'stopped';
        }
      };
    });
    it('returns stopped', function() {
      expect(filterCardBuildStatusTitle(instance)).to.equal('Stopped a few seconds ago');
    });
  });


  describe('running instance', function () {
    var instance;
    beforeEach(function () {
      instance = {
        status: function () {
          return 'running';
        }
      };
    });
    it('returns running', function () {
      expect(filterCardBuildStatusTitle(instance)).to.equal('Running for a few seconds');
    });
  });

  describe('failed build instance', function () {
    var instance;
    beforeEach(function () {
      instance = {
        status: function () {
          return 'buildFailed';
        }
      };
    });
    it('returns Build Failed', function () {
      expect(filterCardBuildStatusTitle(instance)).to.equal('Failed a few seconds ago');
    });
  });

  describe('building instance', function () {
    describe('building', function () {
      var instance;
      beforeEach(function () {
        instance = {
          status: function () {
            return 'building';
          }
        };
      });
      it('returns Building', function() {
        expect(filterCardBuildStatusTitle(instance)).to.equal('Building for a few seconds');
      });
    });

    describe('neverStarted', function () {
      var instance;
      beforeEach(function () {
        instance = {
          status: function () {
            return 'neverStarted';
          }
        };
      });
      it('returns Building', function() {
        expect(filterCardBuildStatusTitle(instance)).to.equal('Building for a few seconds');
      });
    });
  });

});
