'use strict';

describe('isRepoContainerService'.bold.underline.blue, function () {
  var isRepoContainerService;
  var keypather;
  var instance;
  var mainAcv = {};
  var additionalAcv = {
    additionalRepo: true
  };

  function initState() {
    instance = {};
    angular.mock.module('app');

    angular.mock.inject(function (_isRepoContainerService_, _keypather_) {
      isRepoContainerService = _isRepoContainerService_;
      keypather = _keypather_;
    });
  }
  beforeEach(initState);

  it('should return false when appCodeVersions is null', function () {
    expect(isRepoContainerService(null)).to.be.falsy;
  });

  it('should be true when array contains main ACV', function () {
    keypather.set(instance, 'attrs.contextVersion.appCodeVersions', [mainAcv]);
    expect(isRepoContainerService(instance)).to.equal(true);
  });
  it('should be false when array doesn\'t contain a main ACV', function () {
    keypather.set(instance, 'attrs.contextVersion.appCodeVersions', [additionalAcv, additionalAcv]);
    expect(isRepoContainerService(instance)).to.equal(false);
  });
  it('should be true when array contains a main ACV and additional Acvs', function () {
    keypather.set(instance, 'attrs.contextVersion.appCodeVersions', [additionalAcv, mainAcv, additionalAcv]);
    expect(isRepoContainerService(instance)).to.equal(true);
  });
});
