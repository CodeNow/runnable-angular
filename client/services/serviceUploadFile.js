'use strict';

require('app')
  .factory('uploadFile', uploadFile);

function uploadFile(
  Upload
) {
  return function (file, urlPath) {
    return Upload.upload({
      url: urlPath,
      file: file,
      method: 'POST',
      fileFormDataName: 'file',
      withCredentials: true
    });
  };
}