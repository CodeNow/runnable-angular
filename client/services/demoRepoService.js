'use strict';

require('app')
  .factory('demoRepos', demoRepos);


var stacks = {
  nodejs: {
    displayName: 'Node.js',
    description: 'A node.js & MongoDB app',
    repoOwner: 'RunnableDemo',
    icon: '/build/images/logos/logo-icon-nodejs.svg',
    cmd: 'npm migrate && npm start',
    buildCommand: 'npm install',
    env: [
      'MONGODB_HOST='
    ],
    repoName: 'node-starter'
  },
  rails: {
    displayName: 'Rails',
    description: 'A Ruby on Rails & MySQL app',
    repoOwner: 'RunnableDemo',
    icon: '/build/images/logos/logo-icon-rails.svg',
    cmd: 'rake db:migrate && rails server start',
    buildCommand: 'bundle install',
    env: [
      'MYSQL_HOST='
    ],
    repoName: 'rails-starter'
  },
  django: {
    displayName: 'Django',
    description: 'A Django & PostgresSQL app',
    repoOwner: 'RunnableDemo',
    icon: '/build/images/logos/logo-icon-django.svg',
    cmd: 'python manage.py',
    buildCommand: 'pip install',
    env: [
      'POSTGRES_HOST='
    ],
    repoName: 'django-starter'
  },
  php: {
    displayName: 'Laravel',
    description: 'A PHP & MySQL app',
    repoOwner: 'RunnableDemo',
    icon: '/build/images/logos/logo-icon-php.svg',
    cmd: 'apached -d foreground',
    buildCommand: 'composer install',
    env: [
      'POSTGRES_HOST='
    ],
    repoName: 'laravel-starter'
  }
};

function demoRepos(
  $rootScope,
  $timeout,
  $q,
  ahaGuide,
  currentOrg,
  createNewBuildAndFetchBranch,
  fetchInstancesByPod,
  fetchOwnerRepos,
  fetchStackData,
  github,
  keypather
) {
  var showDemoSelector = ahaGuide.isInGuide() && !ahaGuide.hasConfirmedSetup();

  function findNewRepo(stack) {
    return fetchOwnerRepos(currentOrg.github.oauthName())
      .then(function (repos) {
        var repoModel = repos.models.find(function (repo) {
          return repo.attrs.name === stack.repoName;
        });
        return repoModel;
      });
  }
  function findNewRepoOnRepeat(stack, count) {
    count = count || 0;
    if (count > 30) {
      return $q.reject('We were unable to find the repo we just forked. Please try again!');
    }
    return findNewRepo(stack)
      .then(function (repoModel) {
        if (repoModel) {
          return repoModel;
        }
        return $timeout(function () {
          return findNewRepoOnRepeat(stack, ++count);
        }, 1000);
      });
  }
  function getUniqueInstanceName (name, instances, count) {
    count = count || 0;
    var tmpName = name;
    if (count > 0) {
      tmpName = name + '-' + count;
    }
    var instance = instances.find(function (instance) {
      return instance.attrs.name.toLowerCase() === tmpName.toLowerCase();
    });
    if (instance) {
      return getUniqueInstanceName(name, instances, ++count);
    }
    return tmpName;
  }
  function forkGithubRepo(stackKey) {
    if (!stacks[stackKey]) {
      return $q.reject(new Error('Stack doesn\'t exist'));
    }
    var stack = stacks[stackKey];
    return github.forkRepo(stack.repoOwner, stack.repoName, currentOrg.github.oauthName(), keypather.get(currentOrg, 'poppa.attrs.isPersonalAccount'));
  }

  $rootScope.$on('demoService::skip', function () {
    showDemoSelector = false;
  });
  return {
    demoStacks: stacks,
    forkGithubRepo: forkGithubRepo,
    createDemoApp: function (stackKey) {
      var stack = stacks[stackKey];
      return findNewRepo(stack)
        .then(function (repoModel) {
          if (repoModel) {
            // If they already have the repo, don't refork it
            return repoModel;
          }
          return forkGithubRepo(stackKey)
            .then(function () {
              return findNewRepoOnRepeat(stack);
            });
        })
        .then(function (repoModel) {
          return $q.all({
            repoBuildAndBranch: createNewBuildAndFetchBranch(currentOrg.github, repoModel, '', false),
            stack: fetchStackData(repoModel),
            instances: fetchInstancesByPod()
          });
        })
        .then(function (promiseResults) {
          var repoBuildAndBranch = promiseResults.repoBuildAndBranch;
          repoBuildAndBranch.instanceName = getUniqueInstanceName(stack.repoName, promiseResults.instances);
          repoBuildAndBranch.defaults = {
            selectedStack: promiseResults.stack,
            startCommand: stack.cmd,
            keepStartCmd: true,
            step: 3
          };
          return repoBuildAndBranch;
        })
        .then(function () {
          return ahaGuide.endGuide();
        });
    },
    shouldShowDemoSelector: function () {
      return showDemoSelector;
    }
  };
}
