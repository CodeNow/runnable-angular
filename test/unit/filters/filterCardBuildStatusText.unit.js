'use strict';

describe('filteCardbuildStatusText', function () {
  var filterCardBuildStatusText;
  var keypather;
  var instance;
  beforeEach(function() {
    angular.mock.module('app');
    // Needs to have 'Filter' on the end to be properly injected
    angular.mock.inject(function(_cardBuildStatusTextFilter_, _keypather_) {
      filterCardBuildStatusText = _cardBuildStatusTextFilter_;
      keypather = _keypather_;
    });
  });

  describe('crashed instance', function () {
    beforeEach(function () {
      instance = {
        status: function () {
          return 'crashed';
        }
      };
    });
    it('returns crashed', function() {
      expect(filterCardBuildStatusText(instance)).to.equal('Crashed');
    });

    it('prepends a dash when set', function() {
      expect(filterCardBuildStatusText(instance, true)).to.equal('— Crashed');
    });
  });


  describe('stopped instance', function () {
    beforeEach(function () {
      instance = {
        status: function () {
          return 'stopped';
        }
      };
    });
    it('returns stopped', function() {
      expect(filterCardBuildStatusText(instance)).to.equal('Stopped');
    });

    it('prepends a dash when set', function() {
      expect(filterCardBuildStatusText(instance, true)).to.equal('— Stopped');
    });
  });


  describe('failed build instance', function () {
    beforeEach(function () {
      instance = {
        status: function () {
          return 'buildFailed';
        }
      };
    });
    it('returns Build Failed', function () {
      expect(filterCardBuildStatusText(instance)).to.equal('Build Failed');
    });

    it('prepends a dash when set', function () {
      expect(filterCardBuildStatusText(instance, true)).to.equal('— Build Failed');
    });
  });

  describe('building instance', function () {
    describe('building', function () {
      beforeEach(function () {
        instance = {
          status: function () {
            return 'building';
          }
        };
      });
      it('returns Building', function () {
        expect(filterCardBuildStatusText(instance)).to.equal('Building');
      });

      it('prepends a dash when set', function () {
        expect(filterCardBuildStatusText(instance, true)).to.equal('— Building');
      });
    });

    describe('neverStarted', function () {
      beforeEach(function () {
        instance = {
          status: function () {
            return 'neverStarted';
          }
        };
      });
      it('returns Building', function () {
        expect(filterCardBuildStatusText(instance)).to.equal('Building');
      });

      it('prepends a dash when set', function () {
        expect(filterCardBuildStatusText(instance, true)).to.equal('— Building');
      });
    });
  });

});
