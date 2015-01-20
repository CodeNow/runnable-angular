'use strict';

require('app')
  .factory('fetchRepoList', fetchRepoList);

function fetchRepoList(
  async,
  fetchUser,
  QueryAssist
) {
  return function (activeAccount, cb) {
    var fullGithubRepos = [];
    function getOwnerRepoQuery(user, userName, cb) {
      if (userName === user.attrs.accounts.github.username) {
        // does $stateParam.username match this user's username
        return new QueryAssist(user, cb).wrapFunc('fetchGithubRepos');
      } else {
        return new QueryAssist(user.newGithubOrg(userName), cb).wrapFunc('fetchRepos');
      }
    }
    function fetchAllOwnerRepos(user, cb) {
      var pageFetchState = 1;
      function fetchPage(page) {
        var userOrOrg = getOwnerRepoQuery(
          user,
          activeAccount.oauthName(),
          cb
        );
        userOrOrg
          .query({
            page: page,
            sort: 'updated'
          })
          .cacheFetch(function (githubRepos, cached, cb) {
            if (page < pageFetchState) { return; }
            pageFetchState++;
            fullGithubRepos = fullGithubRepos.concat(githubRepos.models);
            // recursive until result set returns fewer than
            // 100 repos, indicating last paginated result
            if (githubRepos.models.length < 100) {
              cb(null, fullGithubRepos, activeAccount);
            } else {
              fetchPage(page + 1);
            }
          })
          .resolve(function (err) {
            if (err) { cb(err); }
          })
          .go();
      }
      fetchPage(1);
    }
    async.waterfall([
      fetchUser,
      fetchAllOwnerRepos
    ], cb);
  };
}
