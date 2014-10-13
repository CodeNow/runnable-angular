module.exports = {
  instance: {
    running: require('./instances/running.json'),
    building: require('./instances/building.json'),
    stopped: require('./instances/stopped.json')
  },
  contextVersion: {
    running: require('./contextVersions/running.json')
  },
  gh: {
    repos: require('./gh/repos.json'),
    commits: require('./gh/commits.json'),
    compare: require('./gh/compare.json')
  }
};