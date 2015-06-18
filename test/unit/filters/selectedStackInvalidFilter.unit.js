'use strict';

describe('selectedStackInvalid', function () {
  var selectedStackInvalid;

  beforeEach(function () {
    angular.mock.module('app');
    angular.mock.inject(function(_selectedStackInvalidFilter_) {
      selectedStackInvalid = _selectedStackInvalidFilter_;
    });
  });

  it('should return true when stack is null', function () {
    expect(selectedStackInvalid(null)).to.be.true;
  });

  it('should return true when stack has no selected version', function () {
    expect(selectedStackInvalid({})).to.be.true;
  });

  it('should return true when dependent stack doesnt have a version', function () {
    expect(selectedStackInvalid({
      dependencies: [{}]
    })).to.be.true;
  });

  it('should return false when stack is good', function () {
    expect(selectedStackInvalid({
      selectedVersion: 'dfasdfsd'
    })).to.be.false;
  });

  it('should return false when dependent stack is good', function () {
    expect(selectedStackInvalid({
      selectedVersion: 'dfasdfsd',
      dependencies: [{
        selectedVersion: 'dfasdfsd'
      }]
    })).to.be.false;
  });

});
