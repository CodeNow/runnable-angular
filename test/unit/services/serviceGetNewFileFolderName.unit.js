'use strict';

describe('serviceGetNewFileFolderName'.bold.underline.blue, function () {

  var getNewFileFolderName;

  function modelify (m) {
    return {
      contents: {
        models: m.map(function (n) { return { attrs: { name: n }}})
      }
    };
  }

  beforeEach(function () {
    angular.mock.module('app');
    angular.mock.inject(function (
      _getNewFileFolderName_
    ) {
      getNewFileFolderName = _getNewFileFolderName_;
    });
  });


  it('should return `newfile` with an empty array', function () {
    var models = modelify([]);

    var results = getNewFileFolderName(models);
    expect(results).to.equal('newfile');
  });

  it('should return `newfile 0` with an unnumbered file', function () {
    var models = modelify([
      'asdf',
      'newfile',
      'dfadfdsfds',
      'filenew'
    ]);

    var results = getNewFileFolderName(models);
    expect(results).to.equal('newfile 0');
  });

  it('should return `newfile 2` when 0 and 1 exist', function () {
    var models = modelify([
      'asdf',
      'newfile',
      'newfile 0',
      'newfile 1',
      'dfadfdsfds',
      'filenew'
    ]);

    var results = getNewFileFolderName(models);
    expect(results).to.equal('newfile 2');
  });

  it('should return `newfile 0` when 1 exists but not zero', function () {
    var models = modelify([
      'asdf',
      'newfile',
      'newfile 1',
      'dfadfdsfds',
      'filenew'
    ]);

    var results = getNewFileFolderName(models);
    expect(results).to.equal('newfile 0');
  });

  it('should return `newfile` only numbered files', function () {
    var models = modelify([
      'asdf',
      'newfile 0',
      'newfile 3',
      'dfadfdsfds',
      'filenew'
    ]);

    var results = getNewFileFolderName(models);
    expect(results).to.equal('newfile');
  });

});
