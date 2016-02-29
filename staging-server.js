'use strict';

console.log('To run this you need to make sure to install node-static, it does not belong in the package.json');

var staticServer = require('node-static');
var path = './client';

var fileServer = new staticServer.Server(path);

require('http').createServer(function (request, response) {
  request.addListener('end', function () {
    fileServer.serve(request, response, function (e, res) {
      if (e && (e.status === 404)) { // If the file wasn't found
        fileServer.serveFile('build/app.html', 200, {}, request, response);
      }
    });
  }).resume();
}).listen(80);
console.log('Server Started.');
