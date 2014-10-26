module.exports = {
  appCodeVersions: {
    index: require('./appCodeVersions/index')
  },
  builds: {
    setup: require('./builds/setup')
  },
  commitCompare: {
    zeroBehind: require('./commitCompare/zeroBehind')
  },
  contextVersions: {
    running: require('./contextVersions/running'),
    setup: require('./contextVersions/setup')
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
    stopped: require('./instances/stopped')
  },
  user: require('./user')
};
