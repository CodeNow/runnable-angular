'use strict';

describe('filterFileGithubLinkUrl', function () {
  var fileGithubLinkUrlFilter;
  var createGithubUrlForFiles;

  beforeEach(function() {
    createGithubUrlForFiles = sinon.spy();
    angular.mock.module('app');

    angular.mock.module('app', function ($provide) {
      $provide.value('createGithubUrlForFiles', createGithubUrlForFiles);
    });

    angular.mock.inject(function(_fileGithubLinkUrlFilter_) {
      fileGithubLinkUrlFilter = _fileGithubLinkUrlFilter_;
    });
  });

  it('should call create github url for files', function () {
    fileGithubLinkUrlFilter('foo', 'contextVersion');
    sinon.assert.calledOnce(createGithubUrlForFiles);
    sinon.assert.calledWith(createGithubUrlForFiles, 'contextVersion', 'foo');
  });

});
