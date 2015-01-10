require('app')
  .factory('fetchStackInfo', fetchStackInfo);

function fetchStackInfo(
  fetchUser,
  configAPIHost,
  user
) {
  return function (repo, cb) {
    function callback(err, res, body) {
      console.log(err, res, body);
      cb(err, body);
    }

    user.client.get('/actions/analyze?repo=' + repo, callback);
  };
}


var stacks = [{
  //'Ruby on Rails': {
  name: 'Ruby on Rails',
  versionReqs: [
    {
      name: 'Ruby',
      selected: '10',
      versions: [
        '10',
        '9',
        '8'
      ]
    }, {
      name: 'Rails',
      selected: '2',
      versions: [
        '3',
        '2',
        '1'
      ]
    }
  ],
  ports: [80, 3000],
  startCommand: 'rails server',
  dockerFile: 'FROM RoR'
}, {
  //'Node': {
  name: 'Node',
  versionReqs: [{
    name: 'Node',
    selected: '0.10.35',
    versions: [
      '0.10.35',
      '0.10.34',
      '0.11'
    ]
  }],
  ports: [80],
  startCommand: 'npm start',
  dockerFile: 'FROM node'
}, {
  //'Angular': {
  name: 'Angular',
  versionReqs: [
    {
      name: 'Node',
      selected: '.10.9',
      versions: [
        '0.10.35',
        '0.10.34',
        '0.11'
      ]
    }, {
      name: 'Angular',
      selected: '1.3',
      versions: [
        '1.3',
        '1.2',
        '.9'
      ]
    }
  ],
  ports: [80],
  startCommand: '//Do some stuff',
  dockerFile: 'FROM node'
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