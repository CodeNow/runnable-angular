require('app')
  .factory('fetchStackInfo', fetchStackInfo);

function fetchStackInfo(
  fetchUser
) {
  return function (repo, cb) {
    fetchUser(function (err, user) {
      //var stackData = user.fetchGithubOrgs(function (err) {
      //  cb(err, stackData);
      //});
      cb(err, {
        stack: stacks[0],
        stacks: stacks,
        dependencies: dependencies
      });
    });
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
    selected: '.10.9',
    versions: [
      '.10.9',
      '.10.8',
      '.11'
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
        '.10.9',
        '.10.8',
        '.11'
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

var dependencies = {
  models: [{
    attrs: {
      name: 'Redis',
      _id: 10
    },
    requiredEnvs: [
      {
        envName: 'port1',
        url: 'http://Redis.user.runnable3.net'
      }, {
        envName: 'port2',
        url: 'http://Redis.user.runnable3.net:27107'
      }
    ]
  }, {
    attrs: {
      name: 'Postgres',
      _id: 11
    },
    requiredEnvs: [
      {
        envName: 'port1',
        url: 'http://Postgres.user.runnable3.net'
      }, {
        envName: 'port2',
        url: 'http://Postgres.user.runnable3.net:3000'
      }
    ]
  }, {
    attrs: {
      name: 'Grunt',
      _id: 12
    },
    requiredEnvs: [
      {
        envName: 'port1',
        url: 'http://Grunt.user.runnable3.net'
      }, {
        envName: 'port2',
        url: 'http://Grunt.user.runnable3.net:3000'
      }
    ]
  }]
};