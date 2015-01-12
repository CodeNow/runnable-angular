'use strict';

module.exports = {
  appCodeVersions: {
    bitcoinAppCodeVersion: require('./appCodeVersions/bitcoinAppCodeVersion'),
    differentBitcoinAppCodeVersion: require('./appCodeVersions/differentBitcoinAppCodeVersion')
  },
  builds: {
    setup: require('./builds/setup')
  },
  branches: {
    bitcoinRepoBranches: require('./branches/bitcoinRepoBranches')
  },
  commit: {
    bitcoinRepoCommit1: require('./commit/bitcoinRepoCommit1')
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
    runningWithContainers: require('./instances/runningWithContainers')
  },
  user: require('./user')
};
