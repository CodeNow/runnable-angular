'use strict';

require('app')
  .factory('fetchStackInfo', fetchStackInfo);

function fetchStackInfo(
  user
) {
  return function (cb) {
    function callback(err, res, body) {
      console.log(err, res, body);
      var stackMap = stacks;
      body.stacks = [];
      body.stackMap = stackMap;

      Object.keys(stackMap).forEach(function (key) {
        var stack = stackMap[key];
        stack.key = key;
        body.stacks.push(stack);
        if (stack.dependencies) {
          stack.dependencies = stack.dependencies.map(function (dep) {
            return stackMap[dep];
          });
        }
      });
      //body.stack = stacks.find(function (stack) {
      //  return body.languageFramework.indexOf(stack.name.toLowerCase()) !== -1;
      //});
      cb(err, body);
    }

    user.client.get('/actions/analyze/info', callback);
  };
}


var stacks = {
  rails: {
    name: 'Rails',
    versions: [
      '3',
      '2',
      '1'
    ],
    selectedVersion: '2',
    dependencies: ['ruby'],
    ports: '80, 3000',
    startCommand: 'rails server',
    preEnvMarker: '<%= ENV[\'',
    postEnvMarker: ']%>\''
  },
  node: {
    name: 'Node.Js',
    selectedVersion: '0.10.35',
    versions: [
      '0.10.35',
      '0.10.34',
      '0.11'
    ],
    ports: '80',
    startCommand: 'npm start',
    preEnvMarker: 'process.env',
    postEnvMarker: ''
  },
  python: {
    name: 'Python',
    selectedVersion: '1.3',
    versions: [
      '1.3',
      '1.2',
      '.9'
    ],
    ports: '80',
    startCommand: '//Do some stuff',
    preEnvMarker: 'os.environ["',
    postEnvMarker: '"]'
  },
  ruby: {
    name: 'Ruby',
    selectedVersion: '10',
    versions: [
      '10',
      '9',
      '8'
    ],
    ports: '80',
    startCommand: '//Do some stuff',
    preEnvMarker: 'os.environ["',
    postEnvMarker: '"]'
  }
};

var dependencies = [{
  attrs: {
    name: 'pixels',
    _id: 10
  }
}, {
  attrs: {
    name: 'Postgres',
    _id: 11
  }
}, {
  attrs: {
    name: 'Grunt',
    _id: 12
  }
}];