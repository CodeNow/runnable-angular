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


  it('should return `newFile` with an empty array', function () {
    var models = modelify([]);

    var results = getNewFileFolderName(models);
    expect(results).to.equal('newFile');
  });

  it('should return `newFolder` with an empty array and if it\'s a directory', function () {
    var models = modelify([]);

    var results = getNewFileFolderName(models, true);
    expect(results).to.equal('newDirectory');
  });

  it('should return `newFile 0` with an unnumbered file', function () {
    var models = modelify([
      'asdf',
      'newFile',
      'dfadfdsfds',
      'filenew'
    ]);

    var results = getNewFileFolderName(models);
    expect(results).to.equal('newFile 0');
  });

  it('should return `newFile 2` when 0 and 1 exist', function () {
    var models = modelify([
      'asdf',
      'newFile',
      'newFile 0',
      'newFile 1',
      'dfadfdsfds',
      'filenew'
    ]);

    var results = getNewFileFolderName(models);
    expect(results).to.equal('newFile 2');
  });

  it('should return `newFile 0` when 1 exists but not zero', function () {
    var models = modelify([
      'asdf',
      'newFile',
      'newFile 1',
      'dfadfdsfds',
      'filenew'
    ]);

    var results = getNewFileFolderName(models);
    expect(results).to.equal('newFile 0');
  });

  it('should return `newFile` only numbered files', function () {
    var models = modelify([
      'asdf',
      'newFile 0',
      'newFile 3',
      'dfadfdsfds',
      'filenew'
    ]);

    var results = getNewFileFolderName(models);
    expect(results).to.equal('newFile');
  });

});
