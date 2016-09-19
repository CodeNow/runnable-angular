'use strict';

describe('ahaGuide'.bold.underline.blue, function () {
  var ahaGuide;
  function initState () {

    angular.mock.module('app');

    angular.mock.inject(function (_ahaGuide_) {
      ahaGuide = _ahaGuide_;
    });
  }
  beforeEach(initState);

  describe('furthestSubstep'.bold, function () {
    describe('getter', function () {
      it('should get the default if nothing is set', function () {
        var result = ahaGuide.furthestSubstep(ahaGuide.steps.ADD_FIRST_BRANCH);
        expect(result).to.equal(ahaGuide.stepList[ahaGuide.steps.ADD_FIRST_BRANCH].defaultSubstep);
      });
      it('should get the value given right before', function () {
        var setResult = ahaGuide.furthestSubstep(ahaGuide.steps.ADD_FIRST_BRANCH, 'dockLoaded');
        var result = ahaGuide.furthestSubstep(ahaGuide.steps.ADD_FIRST_BRANCH);
        expect(result).to.not.equal(ahaGuide.stepList[ahaGuide.steps.ADD_FIRST_BRANCH].defaultSubstep);
        expect(result).to.equal(setResult);
        expect(result).to.equal('dockLoaded');
      });
    });
    describe('setter', function () {
      it('should set the value', function () {
        ahaGuide.furthestSubstep(ahaGuide.steps.ADD_FIRST_BRANCH, 'dockLoaded');
        var result = ahaGuide.furthestSubstep(ahaGuide.steps.ADD_FIRST_BRANCH);
        expect(result).to.not.equal(ahaGuide.stepList[ahaGuide.steps.ADD_FIRST_BRANCH].defaultSubstep);
        expect(result).to.equal('dockLoaded');
      });
      it('should not set the value to a substep that has a lower value', function () {
        var result = ahaGuide.furthestSubstep(ahaGuide.steps.ADD_FIRST_BRANCH, 'dockLoaded');
        expect(result).to.equal('dockLoaded');
        result = ahaGuide.furthestSubstep(ahaGuide.steps.ADD_FIRST_BRANCH, 'dockLoading');
        expect(result).to.not.equal('dockLoading');
        expect(result).to.equal('dockLoaded');
      });
      it('should allow error states to overwrite anywhere', function () {
        var result = ahaGuide.furthestSubstep(ahaGuide.steps.ADD_FIRST_BRANCH, 'dockLoaded');
        expect(result).to.equal('dockLoaded');
        result = ahaGuide.furthestSubstep(ahaGuide.steps.ADD_FIRST_BRANCH, 'deletedTemplate');
        expect(result).to.not.equal('dockLoaded');
        expect(result).to.equal('deletedTemplate');
      });
    });
  });
});
