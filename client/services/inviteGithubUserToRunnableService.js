'use strict';

require('app')
 .factory('inviteGithubUserToRunnable', inviteGithubUserToRunnable);

/**
 * Invite a Github User to Runnable. This will send an email to an arbitrary email
 * address.
 *
 * @param {Number} - Github user ID
 * @param {String} - Email address to whom the email will be sent
 * @param {String} - Github org name
 * @resolves {Object} - Invitation model instance
 * @returns {Promise}
 */
function inviteGithubUserToRunnable(
  $q,
  $state,
  fetchUser,
  fetchGithubOrgId,
  promisify
) {
  return function (githubUserID, email, teamName) {
    if (!teamName) {
      teamName = $state.params.userName;
    }
    return $q.all({
      user: fetchUser(),
      githubOrgId: fetchGithubOrgId(teamName)
    })
      .then(function (response) {
        return promisify(response.user, 'createTeammateInvitation')({
          organization: {
            github: response.githubOrgId
          },
          recipient: {
            email: email,
            github: githubUserID
          }
        });
      });
  };
}
