'use strict';

describe('DirtyCheckerFactory', function () {
  var DirtyChecker;
  beforeEach(function () {
    angular.mock.module('app');
    angular.mock.inject(function (_DirtyChecker_) {
      DirtyChecker = _DirtyChecker_;
    });
  });
  it('should error if bad input ', function () {
    expect(function build() {
      new DirtyChecker({});
    }).to.throw('pathsToWatch must be an array');
  });
  it('should track dirtyChecker with 1 path ', function () {
    var data = {
      hello: 'hello'
    };
    var dirtyChecker = new DirtyChecker(data, ['hello']);
    expect(dirtyChecker.isDirty()).to.be.false;

    data.hello = 'goodbye';
    expect(dirtyChecker.isDirty()).to.be.true;
  });
  it('should track only paths it is given ', function () {
    var data = {
      hello: 'hello',
      name: 'buddy'
    };
    var dirtyChecker = new DirtyChecker(data, ['hello']);
    expect(dirtyChecker.isDirty()).to.be.false;

    data.name = 'goodbye';
    expect(dirtyChecker.isDirty()).to.be.false;
  });
  it('should go back to being dirtyChecker when the changes are reversed ', function () {
    var data = {
      hello: 'hello',
      name: 'buddy'
    };
    var dirtyChecker = new DirtyChecker(data, ['name']);
    expect(dirtyChecker.isDirty()).to.be.false;
    data.name = 'goodbye';
    expect(dirtyChecker.isDirty()).to.be.true;
    data.name = 'buddy';
    expect(dirtyChecker.isDirty()).to.be.false;
  });
  it('should track dirtyChecker with 1 path ', function () {
    var data = {
      hello: 'hello',
      name: 'buddy'
    };
    var dirtyChecker = new DirtyChecker(data, ['hello', 'name']);
    expect(dirtyChecker.isDirty()).to.be.false;

    data.hello = 'goodbye';
    expect(dirtyChecker.isDirty()).to.be.true;

    data.hello = 'hello';
    expect(dirtyChecker.isDirty()).to.be.false;
    data.name = 'dsafsdfasdf';
    expect(dirtyChecker.isDirty()).to.be.true;
  });
});
