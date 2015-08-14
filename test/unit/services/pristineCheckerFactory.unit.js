'use strict';

describe('PristineCheckerFactory', function () {
  var PristineChecker;
  beforeEach(function () {
    angular.mock.module('app');
    angular.mock.inject(function (_PristineChecker_) {
      PristineChecker = _PristineChecker_;
    });
  });
  it('should error if bad input ', function () {
    expect(function build() {
      new PristineChecker({});
    }).to.throw('pathsToWatch must be an array');
  });
  it('should track pristine with 1 path ', function () {
    var data = {
      hello: 'hello'
    };
    var pristine = new PristineChecker(data, ['hello']);
    expect(pristine.isPristine()).to.be.true;

    data.hello = 'goodbye';
    expect(pristine.isPristine()).to.be.false;
  });
  it('should track only paths it is given ', function () {
    var data = {
      hello: 'hello',
      name: 'buddy'
    };
    var pristine = new PristineChecker(data, ['hello']);
    expect(pristine.isPristine()).to.be.true;

    data.name = 'goodbye';
    expect(pristine.isPristine()).to.be.true;
  });
  it('should go back to being pristine when the changes are reversed ', function () {
    var data = {
      hello: 'hello',
      name: 'buddy'
    };
    var pristine = new PristineChecker(data, ['name']);
    expect(pristine.isPristine()).to.be.true;
    data.name = 'goodbye';
    expect(pristine.isPristine()).to.be.false;
    data.name = 'buddy';
    expect(pristine.isPristine()).to.be.true;
  });
  it('should track pristine with 1 path ', function () {
    var data = {
      hello: 'hello',
      name: 'buddy'
    };
    var pristine = new PristineChecker(data, ['hello', 'name']);
    expect(pristine.isPristine()).to.be.true;

    data.hello = 'goodbye';
    expect(pristine.isPristine()).to.be.false;

    data.hello = 'hello';
    expect(pristine.isPristine()).to.be.true;
    data.name = 'dsafsdfasdf';
    expect(pristine.isPristine()).to.be.false;
  });
});
