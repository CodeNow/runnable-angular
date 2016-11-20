'use strict';

require('app')
  .factory('demoRepos', demoRepos);


var stacks = {
  nodejs: {
    displayName: 'Node.js',
    description: 'A Node.js & MongoDB app',
    repoOwner: 'RunnableDemo',
    icon: '/build/images/logos/logo-icon-nodejs.svg',
    cmd: 'npm start',
    buildCommand: 'npm install',
    env: [
      'MONGODB_HOST={{MongoDB}}'
    ],
    ports: [
      3000
    ],
    repoName: 'node-starter',
    deps: [
      'MongoDB'
    ]
  },
  rails: {
    displayName: 'Rails',
    description: 'A Ruby on Rails & MySQL app',
    repoOwner: 'RunnableDemo',
    icon: '/build/images/logos/logo-icon-rails.svg',
    cmd: 'rake db:migrate && rails server start',
    buildCommand: 'bundle install',
    env: [
      'MYSQL_HOST={{MySQL}}'
    ],
    ports: [
      80
    ],
    repoName: 'rails-starter',
    deps: [
      'MySQL'
    ]
  },
  django: {
    displayName: 'Django',
    description: 'A Django & PostgresSQL app',
    repoOwner: 'RunnableDemo',
    icon: '/build/images/logos/logo-icon-django.svg',
    cmd: 'sh start.sh',
    buildCommand: 'pip install -r \'requirements.txt\'',
    env: [
      'DB_HOST={{PostgreSQL}}',
      'DB_NAME=postgres',
      'DB_USER=postgres',
      'DB_PASSWORD='
    ],
    ports: [
      8000
    ],
    repoName: 'django-starter',
    deps: [
      'PostgreSQL'
    ]
  },
  php: {
    displayName: 'Laravel',
    description: 'A PHP & MySQL app',
    repoOwner: 'RunnableDemo',
    icon: '/build/images/logos/logo-icon-php.svg',
    cmd: 'apache2-foreground',
    buildCommand: 'composer install',
    env: [
      'MYSQL_HOST={{MySQL}}'
    ],
    ports: [
      80
    ],
    repoName: 'laravel-starter',
    deps: [
      'MySQL'
    ]
  }
};

function demoRepos(
  $q,
  $rootScope,
  $timeout,
  ahaGuide,
  createAutoIsolationConfig,
  createNewBuildAndFetchBranch,
  createNonRepoInstance,
  currentOrg,
  fetchInstancesByPod,
  fetchNonRepoInstances,
  fetchOwnerRepo,
  fetchStackData,
  github,
  keypather,
  serverCreateService
) {
  var showDemoSelector = ahaGuide.isInGuide() && !ahaGuide.hasConfirmedSetup();

  function findNewRepo(stack) {
    return fetchOwnerRepo(currentOrg.github.oauthName(), stack.repoName);
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
        count++;
        return $timeout(function () {
          return findNewRepoOnRepeat(stack, count);
        }, count * 500);
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
  function findDependencyNonRepoInstances(stack) {
    return fetchNonRepoInstances()
      .then(function (instances) {
        return instances.filter(function (instance) {
          return stack.deps.includes(instance.attrs.name);
        });
      });
  }
  function fillInEnvs(stack, deps) {
    return stack.env.map(function (env) {
      stack.deps.forEach(function (dep) {
        if (deps[dep]) {
          env = env.replace('{{' + dep + '}}', deps[dep].attrs.elasticHostname);
        }
      });
      return env;
    });
  }

  $rootScope.$on('demoService::hide', function () {
    showDemoSelector = false;
  });
  return {
    demoStacks: stacks,
    forkGithubRepo: forkGithubRepo,
    findDependencyNonRepoInstances: findDependencyNonRepoInstances,
    createDemoApp: function (stackKey) {
      var stack = stacks[stackKey];
      return findNewRepo(stack)
        .catch(function forkRepo() {
          return forkGithubRepo(stackKey)
            .then(function () {
              return findNewRepoOnRepeat(stack);
            });
        })
        .then(function (repoModel) {
          return $q.all({
            repoBuildAndBranch: createNewBuildAndFetchBranch(currentOrg.github, repoModel, '', false),
            stack: fetchStackData(repoModel, true),
            instances: fetchInstancesByPod(),
            deps: findDependencyNonRepoInstances(stack)
              .then(function (deps) {
                var depMap = {};
                deps.map(function (depInstance) {
                  depMap[depInstance.attrs.name] = createNonRepoInstance(depInstance.attrs.name, depInstance);
                });
                return $q.all(depMap);
              })
          });
        })
        .then(function (promiseResults) {
          var generatedEnvs = fillInEnvs(stack, promiseResults.deps);

          var repoBuildAndBranch = promiseResults.repoBuildAndBranch;
          repoBuildAndBranch.instanceName = getUniqueInstanceName(stack.repoName, promiseResults.instances);
          repoBuildAndBranch.defaults = {
            selectedStack: promiseResults.stack,
            startCommand: stack.cmd,
            keepStartCmd: true,
            run: [stack.buildCommand]
          };

          return $q.all({
            deps: promiseResults.deps,
            instance: serverCreateService(repoBuildAndBranch, {
              env: generatedEnvs,
              ports: stack.ports
            })
          });
        })
        .then(function (promiseResults) {
          var deps = Object.keys(promiseResults.deps).map(function (id) {
            return promiseResults.deps[id];
          });
          return createAutoIsolationConfig(promiseResults.instance, deps)
            .then(function () {
              return promiseResults.instance;
            });
        });
    },
    shouldShowDemoSelector: function () {
      return showDemoSelector;
    }
  };
}
