'use strict';

require('app')
  .factory('uploadFiles', uploadFiles);

function uploadFiles(
  $http,
  $q,
  configAPIHost
) {

  return function (files, urlPath) {
    var uploadPromises = [];

    Array.prototype.forEach.call(files, function (file, index) {
      var formData = new FormData();
      formData.append('file', file);
      return uploadPromises.push($http({
        method: 'POST',
        data: formData,
        url: configAPIHost + '/' + urlPath,
        headers: {
          'Content-Type': undefined
        }
      }));
    });

    return $q.all(uploadPromises);
  };
}