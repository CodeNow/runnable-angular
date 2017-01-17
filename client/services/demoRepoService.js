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
    buildCommands: [
      'npm install'
    ],
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
    icon: '/build/images/logos/logo-icon-rails.svg',
    cmd: 'rake db:migrate && rails server -b 0.0.0.0 -p 80',
    buildCommands: [
      'bundle install'
    ],
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
    icon: '/build/images/logos/logo-icon-django.svg',
    cmd: 'python manage.py migrate && python manage.py runserver 0.0.0.0:80',
    packages: [
      'postgresql-client'
    ],
    buildCommands: [
      'pip install -r "requirements.txt"'
    ],
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
  ahaGuide,
  createAutoIsolationConfig,
  createNewBuildAndFetchBranch,
  createNonRepoInstance,
  currentOrg,
  demoFlowService,
  fetchInstancesByPod,
  fetchNonRepoInstances,
  fetchOwnerRepo,
  fetchStackData,
  github,
  keypather,
  promisify,
  serverCreateService,
  errs
) {

  function _findNewRepo(stack) {
    return fetchOwnerRepo(currentOrg.github.oauthName(), stack.repoName);
  }

  function checkForOrphanedDependency () {
    // if this item is in the hash of stacks, it has not been built
    // a successfully built demo instance would return true here, not the stack key
    var stackName = demoFlowService.usingDemoRepo();
    // if the key can retrieve a value, we haven't successfully got word back that the instance is building
    if (stacks[stackName]) {
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
    return $q.when(false);
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
  function findDependencyNonRepoInstances(stack) {
    return checkForOrphanedDependency()
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

  function createDemoApp (stackKey) {
    var stack = stacks[stackKey];
    demoFlowService.setUsingDemoRepo(stackKey);
    return _findNewRepo(stack)
      .catch(function forkRepo() {
        return forkGithubRepo(stackKey)
          .then(_findNewRepoOnRepeat.bind(this, stack));
      })
      .then(function (repoModel) {
        return $q.all({
          repoBuildAndBranch: createNewBuildAndFetchBranch(currentOrg.github, repoModel, '', false),
          stack: fetchStackData(repoModel, true),
          instances: fetchInstancesByPod(),
          deps: findDependencyNonRepoInstances(stack)
        });
      })
      .then(function (promiseResults) {
        var generatedEnvs = fillInEnvs(stack, promiseResults.deps);

        var repoBuildAndBranch = Object.assign(promiseResults.repoBuildAndBranch, {
          instanceName: getUniqueInstanceName(stack.repoName, promiseResults.instances),
          defaults: {
            selectedStack: promiseResults.stack,
            startCommand: stack.cmd,
            keepStartCmd: true,
            run: stack.buildCommands,
            packages: stack.packages
          }
        });

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
      })
      .then(function (instance) {
        ahaGuide.endGuide({
          hasConfirmedSetup: true
        });
        demoFlowService.setUsingDemoRepo(true);
        $rootScope.$broadcast('demo::building', instance);
        return instance;
      })
      .catch(errs.handler);
  }

  function createNewInstanceFromBranch (instance) {
    var attempts = 0;
    var acv = instance.contextVersion.getMainAppCodeVersion();
    var completeRepoName = acv.attrs.repo.split('/');
    var repoOwner = completeRepoName[0];
    var repoName = completeRepoName[1];
    var branchName = 'dark-theme';
    demoFlowService.addBranchListener();
    return forkNewInstance(instance);
  }

  function forkNewInstance (instance) {
    return promisify(currentOrg.github, 'fetchRepo')(instance.getRepoName())
      .then(function (repo) {
        return promisify(repo, 'fetchBranch')('dark-theme');
      })
      .then(function (branch) {
        var sha = branch.attrs.commit.sha;
        var branchName = branch.attrs.name;
        return promisify(instance, 'fork')(branchName, sha);
      });
  }

  return {
    _findNewRepo: _findNewRepo, // for testing
    _findNewRepoOnRepeat: _findNewRepoOnRepeat, // for testing
    checkForOrphanedDependency: checkForOrphanedDependency,
    createDemoApp: createDemoApp,
    createNewInstanceFromBranch: createNewInstanceFromBranch,
    demoStacks: stacks,
    forkGithubRepo: forkGithubRepo,
    findDependencyNonRepoInstances: findDependencyNonRepoInstances,
    shouldShowDemoSelector: function () {
      return !!stacks[demoFlowService.usingDemoRepo()] || (ahaGuide.isInGuide() && !ahaGuide.hasConfirmedSetup());
    }
  };
}
