module.exports = {
  instances: {
    running: require('./instances/running.json'),
    building: require('./instances/building.json'),
    stopped: require('./instances/stopped.json')
  },
  builds: {
    setup: require('./builds/setup.json')
  },
  contextVersions: {
    running: require('./contextVersions/running.json'),
    setup: require('./contextVersions/setup.json')
  },
  gh: {
    repos: require('./gh/repos.json'),
    commits: require('./gh/commits.json'),
    compare: require('./gh/compare.json')
  },
  user: require('./user')
};