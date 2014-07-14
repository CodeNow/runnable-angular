var exp = module.exports = {};

exp.unauthorized401 = {
  path: '/users/me?',
  method: 'GET',
  responseCode: 401,
  responseData: {
    statusCode: 401,
    error: "Unauthorized",
    message: "Unauthorized"
  }
};

exp.auth200 = {
  path: '/users/me?',
  method: 'GET',
  responseCode: 200,
  responseData: {"gravitar":"http://www.gravatar.com/avatar/fd3c806f94926cbe683f3ddc878ae4d3","_id":"53c0814f9b9df388196010c6","email":"cflynn.us@gmail.com","lowerUsername":"cflynn07","username":"cflynn07","accounts":{"github":{"refreshToken":null,"accessToken":"da44235236bc98ad0b55bfd1753a053795de7b33","_json":{"updated_at":"2014-07-14T19:55:24Z","created_at":"2010-11-04T19:58:51Z","following":29,"followers":7,"public_gists":4,"public_repos":40,"bio":null,"hireable":false,"email":null,"location":"Boston, MA","blog":"http://www.caseyflynn.com","company":"Cobar Systems LLC","name":"Casey Flynn","site_admin":false,"type":"User","received_events_url":"https://api.github.com/users/cflynn07/received_events","events_url":"https://api.github.com/users/cflynn07/events{/privacy}","repos_url":"https://api.github.com/users/cflynn07/repos","organizations_url":"https://api.github.com/users/cflynn07/orgs","subscriptions_url":"https://api.github.com/users/cflynn07/subscriptions","starred_url":"https://api.github.com/users/cflynn07/starred{/owner}{/repo}","gists_url":"https://api.github.com/users/cflynn07/gists{/gist_id}","following_url":"https://api.github.com/users/cflynn07/following{/other_user}","followers_url":"https://api.github.com/users/cflynn07/followers","html_url":"https://github.com/cflynn07","url":"https://api.github.com/users/cflynn07","gravatar_id":"fd3c806f94926cbe683f3ddc878ae4d3","avatar_url":"https://avatars.githubusercontent.com/u/467885?","id":467885,"login":"cflynn07"},"_raw":"{\"login\":\"cflynn07\",\"id\":467885,\"avatar_url\":\"https://avatars.githubusercontent.com/u/467885?\",\"gravatar_id\":\"fd3c806f94926cbe683f3ddc878ae4d3\",\"url\":\"https://api.github.com/users/cflynn07\",\"html_url\":\"https://github.com/cflynn07\",\"followers_url\":\"https://api.github.com/users/cflynn07/followers\",\"following_url\":\"https://api.github.com/users/cflynn07/following{/other_user}\",\"gists_url\":\"https://api.github.com/users/cflynn07/gists{/gist_id}\",\"starred_url\":\"https://api.github.com/users/cflynn07/starred{/owner}{/repo}\",\"subscriptions_url\":\"https://api.github.com/users/cflynn07/subscriptions\",\"organizations_url\":\"https://api.github.com/users/cflynn07/orgs\",\"repos_url\":\"https://api.github.com/users/cflynn07/repos\",\"events_url\":\"https://api.github.com/users/cflynn07/events{/privacy}\",\"received_events_url\":\"https://api.github.com/users/cflynn07/received_events\",\"type\":\"User\",\"site_admin\":false,\"name\":\"Casey Flynn\",\"company\":\"Cobar Systems LLC\",\"blog\":\"http://www.caseyflynn.com\",\"location\":\"Boston, MA\",\"email\":null,\"hireable\":false,\"bio\":null,\"public_repos\":40,\"public_gists\":4,\"followers\":7,\"following\":29,\"created_at\":\"2010-11-04T19:58:51Z\",\"updated_at\":\"2014-07-14T19:55:24Z\"}","emails":[{"value":null}],"profileUrl":"https://github.com/cflynn07","username":"cflynn07","displayName":"Casey Flynn","id":467885,"provider":"github"}},"created":"2014-07-14T20:02:42.121Z","permissionLevel":1,"showEmail":false,"isModerator":false,"isVerified":false,"registered":true,"_gravitar":"http://www.gravatar.com/avatar/fd3c806f94926cbe683f3ddc878ae4d3","id":"53c0814f9b9df388196010c6"}
};
