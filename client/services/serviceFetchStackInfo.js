'use strict';

require('app')
  .factory('fetchStackInfo', fetchStackInfo);

function fetchStackInfo(
  user
) {
  return function (cb) {
    function callback(err, res, body) {
      console.log(err, res, body);
      var stacks = [];
      Object.keys(body).forEach(function (key) {
        var stack = body[key];
        stack.key = key;
        stack.selectedVersion = stack.defaultVersion;
        stacks.push(stack);
        if (stack.dependencies) {
          stack.dependencies = stack.dependencies.map(function (dep) {
            return body[dep];
          });
        }
      });
      cb(err, stacks);
    }

    user.client.get('/actions/analyze/info', callback);
  };
}

//
//var stacks = {
//  rails: {
//    name: 'Rails',
//    versions: [
//      '4',
//      '4.1',
//      '4.1.4',
//      '4.1.5',
//      '4.1.6',
//      '4.1.7',
//      '4.1.8',
//      '4.2',
//      '4.2.0'
//    ],
//    selectedVersion: '4.2',
//    dependencies: ['ruby'],
//    ports: '3000',
//    startCommand: 'rails server',
//    preEnvMarker: '<%= ENV[\'',
//    postEnvMarker: ']%>\''
//  },
//  node: {
//    name: 'Node.Js',
//    selectedVersion: '0.10.35',
//    versions: [
//      '0.8',
//      '0.8.28 ',
//      '0.10',
//      '0.10.28',
//      '0.10.30',
//      '0.10.31',
//      '0.10.32',
//      '0.10.33',
//      '0.10.34',
//      '0.10.35',
//      '0.11',
//      '0.11.13',
//      '0.11.14'
//    ],
//    ports: '80, 8000, 8080, 3000',
//    startCommand: 'npm start',
//    preEnvMarker: 'process.env',
//    postEnvMarker: ''
//  },
//  python: {
//    name: 'Python',
//    selectedVersion: '3.4.2',
//    versions: [
//      '2',
//      '2-wheezy',
//      '2.7',
//      '2.7-wheezy',
//      '2.7.7',
//      '2.7.8',
//      '2.7.8-wheezy',
//      '2.7.9',
//      '2.7.9-wheezy',
//      '3',
//      '3-wheezy',
//      '3.3',
//      '3.3-wheezy',
//      '3.3.5',
//      '3.3.6',
//      '3.3.6-wheezy',
//      '3.4',
//      '3.4-wheezy',
//      '3.4.1',
//      '3.4.2',
//      '3.4.2-wheezy'
//    ],
//    ports: '80',
//    startCommand: 'python3 main.py',
//    preEnvMarker: 'os.environ["',
//    postEnvMarker: '"]'
//  },
//  ruby: {
//    name: 'Ruby',
//    selectedVersion: '2.2',
//    versions: [
//      '1',
//      '1.9',
//      '1.9.3',
//      '1.9.3-p547',
//      '1.9.3-p550',
//      '1.9.3-p551',
//      '2',
//      '2.0',
//      '2.0.0 ',
//      '2.0.0-p576',
//      '2.0.0-p594',
//      '2.0.0-p598',
//      '2.1',
//      '2.1.1',
//      '2.1.2',
//      '2.1.3',
//      '2.1.4',
//      '2.1.5',
//      '2.2',
//      '2.2.0',
//      '2.2.0-rc1'
//    ],
//    ports: '3000',
//    startCommand: '//Do some stuff',
//    preEnvMarker: 'os.environ["',
//    postEnvMarker: '"]'
//  }
//};