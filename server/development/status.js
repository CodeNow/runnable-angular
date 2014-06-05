var path = require('path');
var Git = require('git-tools');
var async = require('async');

var rootPath = path.join(__dirname, '../../');
var git = new Git(rootPath);

module.exports = function (req, res, next) {
  async.parallel([
    function (cb) {
      git.exec('status', cb);
    },
    function (cb) {
      git.exec('log', '--pretty=format:[%an] \t %ar \t %s', cb);
    },
    function (cb) {
      git.exec('diff', cb);
    }
  ], function (err, result) {
    res.json({
      status: result[0],
      log: result[1],
      diff: result[2]
    });
  });
};