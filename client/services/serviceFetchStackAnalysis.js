'use strict';

require('app')
  .factory('fetchStackAnalysis', fetchStackAnalysis);

function fetchStackAnalysis(
  user
) {
  return function (repo, cb) {
    function callback(err, res, body) {
      console.log(err, res, body);
      body.stack = stacks.find(function (stack) {
        return body.languageFramework.indexOf(stack.name.toLowerCase()) !== -1;
      });
      cb(err, body);
    }

    user.client.get('/actions/analyze?repo=' + repo, callback);
  };
}


var stacks = [{
  name: 'Ruby on Rails',
  versionReqs: [
    {
      name: 'Ruby',
      key: 'ruby',
      selected: '10',
      versions: [
        '10',
        '9',
        '8'
      ]
    }, {
      name: 'Rails',
      key: 'rails',
      selected: '2',
      versions: [
        '3',
        '2',
        '1'
      ]
    }
  ],
  ports: '80, 3000',
  startCommand: 'rails server',
  preEnvMarker: '<%= ENV[\'',
  postEnvMarker: ']%>\''
}, {
  name: 'Node.Js',
  versionReqs: [{
    name: 'Node.Js',
    key: 'node',
    selected: '0.10.35',
    versions: [
      '0.10.35',
      '0.10.34',
      '0.11'
    ]
  }],
  ports: '80',
  startCommand: 'npm start',
  preEnvMarker: 'process.env',
  postEnvMarker: ''
}, {
  name: 'Python',
  versionReqs: [
    {
      name: 'Python',
      key: 'python',
      selected: '1.3',
      versions: [
        '1.3',
        '1.2',
        '.9'
      ]
    }
  ],
  ports: '80',
  startCommand: '//Do some stuff',
  preEnvMarker: 'os.environ["',
  postEnvMarker: '"]'
}];

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