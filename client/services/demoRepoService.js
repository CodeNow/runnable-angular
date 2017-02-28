'use strict';

require('app')
  .factory('demoRepos', demoRepos);

var stacks = {
  nodejs: {
    displayName: 'Node.js',
    description: 'A Node.js & MongoDB app',
    repoOwner: 'RunnableDemo',
    branchName: 'master',
    icon: '/build/images/logos/logo-icon-nodejs.svg',
    cmd: 'npm start',
    buildCommands: [
      'npm install'
    ],
    dockerComposePath: 'docker-compose.yml',
    env: [
      'MONGODB_HOST={{MongoDB}}',
      'PORT=80'
    ],
    ports: [
      80
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
    branchName: 'master',
    icon: '/build/images/logos/logo-icon-rails.svg',
    cmd: 'rake db:migrate && rails server -b 0.0.0.0 -p 80',
    buildCommands: [
      'bundle install'
    ],
    dockerComposePath: 'docker-compose.yml',
    env: [
      'DATABASE_URL=postgres://postgres@{{PostgreSQL}}:5432/postgres'
    ],
    ports: [
      80
    ],
    repoName: 'rails-starter',
    deps: [
      'PostgreSQL'
    ]
  },
  django: {
    displayName: 'Django',
    description: 'A Django & PostgresSQL app',
    repoOwner: 'RunnableDemo',
    branchName: 'master',
    icon: '/build/images/logos/logo-icon-django.svg',
    cmd: 'python manage.py migrate && python manage.py runserver 0.0.0.0:80',
    packages: [
      'postgresql-client'
    ],
    buildCommands: [
      'pip install -r "requirements.txt"'
    ],
    dockerComposePath: 'docker-compose.yml',
    env: [
      'DB_HOST={{PostgreSQL}}',
      'DB_PORT=5432',
      'DB_NAME=postgres',
      'DB_USER=postgres',
      'DB_PASSWORD='
    ],
    ports: [
      80
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
    branchName: 'master',
    icon: '/build/images/logos/logo-icon-php.svg',
    cmd: 'php artisan migrate && apache2-foreground',
    buildCommands: [
      'composer install',
      'rmdir /var/www/html/',
      'ln -s /var/www/public /var/www/html',
      'chown -R www-data /var/www/',
      'chgrp -R www-data /var/www/',
      'chmod -R 775 /var/www/storage'
    ],
    dockerComposePath: 'docker-compose.yml',
    env: [
      'APP_ENV=local',
      'APP_KEY=Idgz1PE3zO9iNc0E3oeH3CHDPX9MzZe3',
      'DB_HOST={{MySQL}}',
      'DB_PORT=3306',
      'DB_DATABASE=app',
      'DB_USERNAME=mysql',
      'DB_PASSWORD=mysql'
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
  createAutoIsolationConfig,
  createNewBuildByContextVersion,
  createNewCluster,
  createNewInstance,
  createNonRepoInstance,
  currentOrg,
  demoFlowService,
  errs,
  fetchContextVersion,
  fetchGitHubRepoBranch,
  fetchInstancesByPod,
  fetchNonRepoInstances,
  fetchOwnerRepo,
  fetchUser,
  fetchStackData,
  github,
  invitePersonalRunnabot,
  keypather,
  promisify,
  serverCreateService,
  watchOncePromise
) {

  function _findNewRepo(stack) {
    return fetchOwnerRepo(currentOrg.github.oauthName(), stack.repoName);
  }

  function _findNewRepoOnRepeat(stack, count) {
    count = count || 0;
    if (count > 30) {
      return $q.reject('We were unable to find the repo we just forked. Please try again!');
    }
    return _findNewRepo(stack)
      .catch(function (err) {
        if (keypather.get(err, 'output.statusCode') !== 404) {
          return $q.reject(err);
        }
      })
      .then(function (repoModel) {
        if (repoModel) {
          return repoModel;
        }
        count++;
        return $timeout(function () {
          return _findNewRepoOnRepeat(stack, count);
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

  var hasDemoBuiltPromise = fetchInstancesByPod()
      .then(function (allInstances) {
        return watchOncePromise($rootScope, function () {
          return allInstances.models.find(function (instance) {
            // We need to get the main instance
            return instance.getRepoName();
          });
        }, true);
      });

  var shouldShowDemoSelector = true;
  hasDemoBuiltPromise.then(function () {
    shouldShowDemoSelector = false;
  });

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

  function checkForOrphanedDependency (stackName) {
    var repoName = stacks[stackName].repoName;
    var dep;
    var repoInstance;
    return fetchInstancesByPod()
      .then(function (instances) {
        instances.models.some(function (instance) {
          // we checking here to be sure that the instance has a repo/acv
          // to distinguish between the dependency instances
          if (instance.contextVersion.getMainAppCodeVersion() && instance.attrs.name === repoName) {
            repoInstance = instance;
          } else {
            dep = instance;
          }
          return dep && repoInstance;
        });
        if (dep && !repoInstance) {
          return stackName;
        }
        return false;
      });
  }

  function findDependencyNonRepoInstances(stack, stackKey) {
    return checkForOrphanedDependency(stackKey)
      .then(function (hasOrphanedDependency) {
        if (hasOrphanedDependency) {
          return fetchInstancesByPod()
            .then(function (instances) {
              var dependency = instances.models.find(function (instance) {
                return !instance.contextVersion.getMainAppCodeVersion() && stack.deps.includes(instance.attrs.name);
              });
              var demoDependency = {};
              demoDependency[dependency.attrs.name] = dependency;
              return demoDependency;
            });
        }
        return fetchNonRepoInstances()
          .then(function (instances) {
            return instances.filter(function (instance) {
              return stack.deps.includes(instance.attrs.name);
            });
          })
          .then(function (deps) {
            var depMap = deps.reduce(function (map, depInstance) {
              map[depInstance.attrs.name] = createNonRepoInstance(depInstance.attrs.name, depInstance);
              return map;
            }, {});
            return $q.all(depMap);
          });
      });
  }

  function createInstance (containerName, build, activeAccount, opts) {
    return fetchUser()
    .then(function (user) {
      var instanceOptions = {
        name: containerName,
        owner: {
          username: activeAccount.oauthName()
        }
      };
      return user.newInstance(instanceOptions, {warn: false});
    })
    .then(function (instance) {
      opts = angular.extend({
        masterPod: true,
        name: containerName,
        env: [],
        ipWhitelist: {
          enabled: false
        },
        isTesting: false,
        shouldNotAutofork: false
      }, opts);
      return createNewInstance(
        activeAccount,
        build,
        opts,
        instance
      );
    });
  }

  function fetchContextVersionForStack (stack) {
    var stackName = stack.repoName;
    return fetchUser()
      .then(function (user) {
        // Should be contexts with the stack name. These need to be added
        return promisify(user, 'fetchContexts')({ isSource: true });
      })
      .then(function (contexts) {
        var context = contexts.find(function (context) {
          return stackName === keypather.get(context, 'attrs.name');
        });
        if (!context) {
          return $q.reject(new Error('No context found for ' + stackName));
        }
        return promisify(context, 'fetchVersions')({ qs: { sort: '-created' }});
      })
      .then(function (versions) {
        return fetchGitHubRepoBranch(stack.repoOwner, stack.repoName, stack.branchName)
          .then(function (branch) {
            var version = versions.find(function (version) {
              var branchName = keypather.get(version, 'getMainAppCodeVersion().attrs.branch');
              var commit = keypather.get(version, 'getMainAppCodeVersion().attrs.commit');
              var buildFailed = keypather.get(version, 'attrs.build.failed');
              return branchName === stack.branchName && !buildFailed && commit === branch.commit.sha;
            });
            if (!version) {
              return $q.reject(new Error('No context version found for ' + stackName));
            }
            return version;
          });
      });
  }

  function createDemoAppForPersonalAccounts (stackKey) {
    var stack = stacks[stackKey];
    return $q.all([
      fetchOwnerRepo(stack.repoOwner, stack.repoName),
      fetchContextVersionForStack(stack)
    ])
      .then(function (res) {
        var repoModel = res[0];
        var contextVersion = res[1];
        var inviteRunnabot = invitePersonalRunnabot({
          repoName: stack.repoName,
          githubUsername: currentOrg.getDisplayName()
        });
        return $q.all({
          build: createNewBuildByContextVersion(currentOrg.github, contextVersion),
          stack: fetchStackData(repoModel, true),
          instances: fetchInstancesByPod(),
          deps: findDependencyNonRepoInstances(stack, stackKey),
          inviteRunnabot: inviteRunnabot
        });
      })
      .then(function (promiseResults) {
        var generatedEnvs = fillInEnvs(stack, promiseResults.deps);
        var instanceName = getUniqueInstanceName(stack.repoName, promiseResults.instances);
        return $q.all({
          deps: promiseResults.deps,
          instance: createInstance(instanceName, promiseResults.build, $rootScope.dataApp.data.activeAccount, {
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
  }

  function createDemoAppForNonPersonalAccounts (stackKey) {
    var stack = stacks[stackKey];
    return fetchOwnerRepo(stack.repoOwner, stack.repoName)
     .then(function (repoModel) {
        var promises = [
          createNewCluster(repoModel.attrs.full_name, 'master', stack.dockerComposePath, stack.repoName)
        ];
        return $q.all(promises);
      });
  }

  function createDemoApp (stackKey) {
    return $q.when()
      .then(function () {
        if (currentOrg.isPersonalAccount()) {
          return createDemoAppForPersonalAccounts(stackKey);
        }
        return createDemoAppForNonPersonalAccounts(stackKey);
      })
      .then(function () {
        return hasDemoBuiltPromise;
      })
      .then(function (instance) {
        $rootScope.$broadcast('demo::building', instance);
        return instance;
      })
      .catch(errs.handler);
  }
  return {
    _findNewRepo: _findNewRepo, // for testing
    _findNewRepoOnRepeat: _findNewRepoOnRepeat, // for testing
    checkForOrphanedDependency: checkForOrphanedDependency,
    createDemoApp: createDemoApp,
    createInstance: createInstance,
    createDemoAppForPersonalAccounts: createDemoAppForPersonalAccounts,
    fetchContextVersionForStack: fetchContextVersionForStack,
    demoStacks: stacks,
    forkGithubRepo: forkGithubRepo,
    shouldShowDemoSelector: function () {
      return demoFlowService.isInDemoFlow() && shouldShowDemoSelector;
    }
  };
}
