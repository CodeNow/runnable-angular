'use strict';

module.exports = {
  appCodeVersions: {
    bitcoinAppCodeVersion: require('./appCodeVersions/bitcoinAppCodeVersion'),
    differentBitcoinAppCodeVersion: require('./appCodeVersions/differentBitcoinAppCodeVersion')
  },
  builds: {
    setup: require('./builds/setup'),
    built: require('./builds/built')
  },
  branches: {
    bitcoinRepoBranches: require('./branches/bitcoinRepoBranches')
  },
  commit: {
    bitcoinRepoCommit1: require('./commit/bitcoinRepoCommit1'),
    bitcoinRepoCommit2: require('./commit/bitcoinRepoCommit2')
  },
  commitCompare: {
    zeroBehind: require('./commitCompare/zeroBehind')
  },
  contextVersions: {
    running: require('./contextVersions/running'),
    setup: require('./contextVersions/setup')
  },
  files: {
    dockerfile: require('./files/dockerfile')
  },
  gh: {
    bitcoinRepoCommits: require('./gh/bitcoinRepoCommits'),
    repos: require('./gh/repos'),
    commits: require('./gh/commits'),
    compare: require('./gh/compare')
  },
  instances: {
    running: require('./instances/running'),
    building: require('./instances/building'),
    stopped: require('./instances/stopped'),
    runningWithContainers: require('./instances/runningWithContainers'),
    list: require('./instances/list')
  },
  repoList: require('./repoList'),
  user: require('./user'),
  stackInfo: [
    {
      name: 'Rails',
      key: 'rails',
      versions: [
        '4',
        '4.1',
        '4.1.4',
        '4.1.5',
        '4.1.6',
        '4.1.7',
        '4.1.8',
        '4.2',
        '4.2.0'
      ],
      dependencies: [{
        name: 'Ruby',
        key: 'ruby',
        versions: [
          '0.8',
          '0.8.28 ',
          '0.10'
        ],
        ports: '80, 8000, 8080, 3000',
        startCommand: 'npm start',
        preEnvMarker: 'process.env',
        postEnvMarker: ''
      }],
      ports: '3000',
      startCommand: 'rails server',
      preEnvMarker: '<%= ENV[\'',
      postEnvMarker: ']%>\''
    },
    {
      name: 'Node.Js',
      key: 'node',
      versions: [
        '0.8',
        '0.8.28 ',
        '0.10',
        '0.10.28',
        '0.10.30',
        '0.10.31',
        '0.10.32',
        '0.10.33',
        '0.10.34',
        '0.10.35',
        '0.11',
        '0.11.13',
        '0.11.14'
      ],
      ports: '80, 8000, 8080, 3000',
      startCommand: 'npm start',
      preEnvMarker: 'process.env',
      postEnvMarker: ''
    }
  ]
};
