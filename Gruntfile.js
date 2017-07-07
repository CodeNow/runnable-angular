'use strict';

var path    = require('path');
var find    = require('find');
var fs      = require('fs');
var async   = require('async');
var envIs   = require('101/env-is');
var timer   = require('grunt-timer');
var version = require('./package.json').version;

var historyApiFallback = function () {};
if (!envIs('production', 'staging')) {
  historyApiFallback = require('connect-history-api-fallback');
}

var config = {};

module.exports = function(grunt) {
  timer.init(grunt, {
    friendlyTime: true
  });

  var sassDir   = 'client/assets/styles/scss';
  var sassIndex = path.join(sassDir, 'index.scss');
  var sassError = path.join(sassDir, 'error.scss');
  var jshintFiles = [
    'Gruntfile.js',
    'client/**/*.js',
    '!client/build/**/*.js',
    '!client/dist/**/*.js',
    '!client/assets/**/*.js',
    'server/**/*.js'
    // 'test/**/*.js'
  ];

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concurrent: {
      dev: {
        tasks: ['watch:images', 'watch:javascripts', 'watch:templates', 'watch:styles', 'watch:jade'],
        options: {
          limit: 10,
          logConcurrentOutput: true
        }
      },
      devNoBS: {
        tasks: ['watch:images', 'watch:javascripts', 'watch:templates', 'watch:styles', 'watch:jade', 'nodemon'],
        options: {
          limit: 10,
          logConcurrentOutput: true
        }
      }
    },
    nodemon: {
      dev: {
        script: 'server/main.js',
        options: {
          env: {
            'PORT': 3001,
            'NODE_ENV': 'development',
            'NODE_PATH': '.'
          },
          watch: ['server/**/*.js']
        }
      }
    },
    autoprefixer: {
      dist: {
        options: {
          browsers: ['last 2 versions'],
          map: true
        },
        files: {
          'client/build/css/index.css' : 'client/build/css/index.css',
          'client/build/css/error.css' : 'client/build/css/error.css'
        }
      }
    },
    sass: {
      compile: {
        options: {
          outputStyle: 'compressed'
        },
        files: {
          'client/build/css/error.css': sassError,
          'client/build/css/index.css': sassIndex
        }
      },
      dev: {
        options: {
          outputStyle: 'nested',
          sourceMap: true
        },
        files: {
          'client/build/css/error.css': sassError,
          'client/build/css/index.css': sassIndex
        }
      }
    },
    jshint: {
      prod: {
        options: {
          jshintrc: '.jshintrc-prod'
        },
        src: jshintFiles
      },
      dev: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: jshintFiles
      }
    },
    browserify: {
      watch: {
        files: {
          'client/build/js/bundle.js': 'client/main.js',
          'client/build/js/ace.js': 'client/lib/ace.js'
        },
        options: {
          watch: true,
          browserifyOptions: {
            debug: true // source maps,
          }
        }
      },
      once: {
        files: {
          'client/build/js/bundle.js': 'client/main.js',
          'client/build/js/ace.js': 'client/lib/ace.js'
        },
        options: {
          browserifyOptions: {
            debug: true // source maps
          }
        }
      }
    },
    jade2js: {
      compile: {
        options: {
          namespace: 'Templates'
        },
        files: {
          './client/build/views/viewBundle.js': [
            './client/templates/**/*.jade',
            './client/directives/**/*.jade'
          ]
        }
      }
    },
    copy: {
      images: {
        expand: true,
        cwd: 'client/assets/images/',
        src: '**',
        dest: 'client/build/images/',
        flatten: false,
        filter: 'isFile'
      }
    },
    watch: {
      images: {
        files: [
          'client/assets/images/**/*.jpg',
          'client/assets/images/**/*.jpeg',
          'client/assets/images/**/*.png',
          'client/assets/images/**/*.svg'
        ],
        tasks: [
          'newer:copy:images'
        ]
      },
      tests: {
        files: [
          'client/build/**/*.js',
          'test/**/*.js'
        ],
        tasks: [
          'bgShell:karma'
        ]
      },
      javascripts: {
        files: [
          'client/**/*.js',
          'package.json',
          'node_modules/runnable/**/*.js',
          '!node_modules/runnable/node_modules/**/*.*',
          '!client/build/**/*.*',
          '!client/dist/**/*.*'
        ],
        tasks: [
          'newer:jshint:dev',
          'autoBundleDependencies'
        //  'bgShell:karma'
        ],
        options: {
          spawn: false
        }
      },
      templates: {
        files: [
          'client/**/*.jade',
          '!client/build/**/*.*',
          '!client/dist/**/*.*'
        ],
        tasks: [
          'jade2js'
        //  'bgShell:karma'
        ]
      },
      styles: {
        files: [
          'client/**/*.scss',
          'client/**/*.css',
          '!client/build/**/*.*',
          '!client/dist/**/*.*'
        ],
        tasks: [
          'sass:dev',
          'autoprefixer'
        ]
      },
      jade: {
        files: [
          'layout.jade'
        ],
        tasks: ['newer:jade:compile']
      }
    },
    bgShell: {
      _defaults: {
        fail: true
      },
      karma: {
        bg: false,
        cmd: 'karma start ./test/karma.conf.js --single-run'
      },
      'karma-circle': {
        bg: false,
        cmd: 'karma start ./test/karma.circle.conf.js --single-run'
      },
      'karma-watch': {
        bg: false,
        cmd: 'karma start ./test/karma.conf.js'
      },
      e2e: {
        bg: false,
        cmd: 'node test/ghost-inspector.js'
      },
      server: {
        cmd: 'NODE_PATH=. node ./node_modules/nodemon/bin/nodemon.js -e js,hbs index.js',
        bg: true,
        execOpts: {
          maxBuffer: 1000*1024
        }
      },
      'npm-install': {
        bg: false,
        cmd: 'echo \'installing dependencies...\n\' && npm install --silent'
      }
    },
    jsbeautifier: {
      files: ['client/**/*.js', '!client/build/**/*.js', '!client/assets/**/*.js'],
      options: {
        js: {
          indentSize: 2,
          jslintHappy: true
        }
      }
    },
    coverage: {
      default: {
        options: {
          thresholds: {
            statements   : 72.5,
            branches     : 55.3,
            functions    : 66.0,
            lines        : 72.6
          },
          dir: 'coverage',
          root: 'test'
        }
      }
    },
    jade: {
      compile: {
        options: {
          data: function () {
            var locals = {
              version: version,
              env: 'production', // require('./client/config/json/environment.json').environment,
              commitHash: require('./client/config/json/commit.json').commitHash,
              commitTime: require('./client/config/json/commit.json').commitTime,
              apiHost: require('./client/config/json/api.json').host,
              mixpanelProxyUrl: require('./client/config/json/api.json').mixpanelProxyUrl,
              disableMixpanel: require('./client/config/json/api.json').disableMixpanel,
              disableAnalytics: require('./client/config/json/api.json').disableAnalytics
            };
            locals.rollbarEnv = locals.env;
            if (locals.apiHost.indexOf('runnable-beta.com') > -1) {
              locals.rollbarEnv = 'production-beta';
            } else if (locals.apiHost.indexOf('runnable-gamma.com') > -1) {
              locals.rollbarEnv = 'production-gamma';
            }
            return locals;
          }
        },
        files: {
          'client/build/app.html': 'layout.jade'
        }
      }
    },
    uglify: {
      options: {
        sourceMap: true,
        sourceMapIncludeSources: true,
        mangle: false
      },
      app: {
        files: {
          'client/build/js/ace.js': ['client/build/js/ace.js'],
          'client/build/js/bundle.js': ['client/build/js/bundle.js']
        }
      }
    },
    browserSync: {
      dev: {
        bsFiles: {
          src : [
            'client/build/js/*.js',
            'client/build/css/*.css',
            'client/build/*.html'
          ]
        },
        options: {
          watchTask: true,
          server: {
            baseDir: 'client/build/',
            middleware: [
              historyApiFallback({
                index: '/app.html',
                rewrites: [
                  {
                    from: /^\/build\//,
                    to: function (context) {
                      return context.parsedUrl.pathname.replace('/build', '');
                    }
                  }
                ]
              })
            ]
          }
        }
      }
    },
    s3: {
      options: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        bucket: process.env.AWS_BUCKET,
        region: process.env.AWS_REGION,
        createBucket: true,
        enableWeb: true,
        gzip: true,
        headers: {
          ContentEncoding: 'gzip',
          CacheControl: 60 * 5
        }
      },
      build: {
        files: [{
          cwd: 'client/build/',
          src: '**',
          dest: 'build/'
        }, {
          'index.html': 'client/build/app.html'
        }]
      }
    }
  });

  grunt.registerTask('autoBundleDependencies', 'generates index.js files that require all other files in the directory', function () {
    var done       = this.async();
    var clientPath = path.join(__dirname, 'client');
    async.series([
      bundle('polyfills'),
      bundle('controllers'),
      bundle('services'),
      bundle('filters'),
      bundle('directives'),
      bundle('decorators')
    ], function () { done(); });

    function bundle (subDir) {
      return (function (subDir) {
        return function (cb) {
          var workingPath = path.join(clientPath, subDir);
          var indexPath = path.join(workingPath, 'index.js');

          find.file(/\.js$/, workingPath, function (files) {
            var newFileString = '';
            // Add use strict to file
            newFileString += '\'use strict\';\n';
            // Add file require
            newFileString += files
              .map(function (item) {
                return item.replace(workingPath, '.').replace(/\.js$/, '');
              })
              .reduce(function (previous, current) {
                if (current === './index') { return previous; }
                return previous += 'require(\'' + current + '\');\n';
              }, '');

            fs.exists(indexPath, function (exists) {
              if (exists) {
                // Only write if we need to
                fs.readFile(indexPath, 'UTF-8', function (err, fileString) {
                  if (err) { return cb(err); }
                  if (fileString.trim() === newFileString.trim()) {
                    return cb();
                  }
                  grunt.log.writeln('writing new', subDir, 'index.js (cached)');
                  fs.writeFile(indexPath, newFileString, cb);
                });
              } else {
                grunt.log.writeln('writing new', subDir, 'index.js');
                fs.writeFile(indexPath, newFileString, cb);
              }
            });
          });
        };
      })(subDir);
    }
  });

  grunt.registerTask('generateConfigs', 'Generates the configuration file', function (environment) {
    var done = this.async();
    var clientPath = path.join(__dirname, 'client');
    async.parallel([
      function (cb) {
        var configObj = {};
        configObj.host = process.env.API_URL || 'https://api-staging-codenow.runnableapp.com/';
        configObj.mixpanelProxyUrl = process.env.MIXPANEL_PROXY_URL || 'https://api.mixpanel.com';
        configObj.socketHost = process.env.API_SOCK_URL || configObj.host;
        configObj.userContentDomain = process.env.USER_CONTENT_DOMAIN || 'runnableapp.com';
        configObj.corporateUrl = process.env.MARKETING_URL || 'https://runnable.com';
        configObj.stripeToken = process.env.STRIPE_TOKEN || 'pk_test_sHr5tQaPtgwiE2cpW6dQkzi8';
        configObj.siftApiKey = process.env.SIFT_API_KEY || 'eea9746dff';
        configObj.githubUrl = process.env.GITHUB_URL || 'https://api.github.com';
        configObj.githubHttpUrl = process.env.GITHUB_HTTP_URL || 'https://github.com';
        configObj.disableMixpanel = process.env.DISABLE_MIXPANEL || false;
        configObj.disableAnalytics = process.env.DISABLE_ANALYTICS || false;
        configObj.superUser = process.env.SUPER_USER || 'HelloRunnable';

        if (configObj.host.charAt(configObj.host.length - 1) === '/') {
          configObj.host = configObj.host.substr(0, configObj.host.length - 1);
        }

        config.host = configObj.host;
        config.userContentDomain = configObj.userContentDomain;
        var configJSON = JSON.stringify(configObj);
        fs.writeFile(path.join(clientPath, 'config', 'json', 'api.json'), configJSON, function () {
          cb();
        });
      },
      function (cb) {
        var configObj = {};
        var exec = require('child_process').exec;
        // git log -1 --format=%cd
        async.parallel({
          time: function (cb) {
            exec('git log -1 --format=%cd', {cwd: __dirname}, function (err, stdout, stderr) {
              cb(null, stdout.split('\n').join(''));
            });
          },
          hash: function (cb) {
            exec('git rev-parse HEAD', {cwd: __dirname}, function (err, stdout, stderr) {
              cb(null, stdout.split('\n').join(''));
            });
          }
        }, function (err, results) {
          if (err) { throw err; }
          configObj.commitHash = results.hash;
          configObj.commitTime = results.time;
          var configJSON = JSON.stringify(configObj);
          fs.writeFile(path.join(clientPath, 'config', 'json', 'commit.json'), configJSON, function () {
            cb();
          });
        });
      },
      function (cb) {
        var configObj = {
          environment: environment || process.env.NODE_ENV || 'development'
        };
        var configJSON = JSON.stringify(configObj);
        fs.writeFile(path.join(clientPath, 'config', 'json', 'environment.json'), configJSON, function () {
          cb();
        });
      }
    ], function () {
      done();
    });
  });

  grunt.registerTask('deleteOldCoverage', '', function () {
    function deleteFolderRecursive(path) {
      var files = [];
      if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function (file, index) {
          var curPath = path + '/' + file;
          if (fs.lstatSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursive(curPath);
          } else { // delete file
            if (file !== '.gitkeep') {
              fs.unlinkSync(curPath);
            }
          }
        });
      }
    }

    if (fs.existsSync('test/coverage')) {
      deleteFolderRecursive('test/coverage');
    }
  });



  grunt.loadNpmTasks('grunt-aws');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-bg-shell');
  grunt.loadNpmTasks('grunt-jade-plugin');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-compile-handlebars');

  if (!envIs('production', 'staging')) {
    grunt.loadNpmTasks('grunt-newer');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-istanbul');
    grunt.loadNpmTasks('grunt-istanbul-coverage');
    grunt.loadNpmTasks('grunt-browser-sync');
  }

  grunt.registerTask('test:watch', ['bgShell:karma-watch']);
  grunt.registerTask('test:unit', ['bgShell:karma']);

  grunt.registerTask('test:unit-coverage', [
    'deleteOldCoverage',
    'bgShell:karma-circle', // Use the circle karma.conf so it browserifies everything it needs
    'coverage'
  ]);
  grunt.registerTask('test:e2e', ['bgShell:e2e']);
  grunt.registerTask('test', [
    'generateConfigs',
    'autoBundleDependencies',
    'jade2js',
    'jshint:prod',
    'bgShell:karma'
  ]);
  grunt.registerTask('default', [
    'bgShell:npm-install',
    'copy',
    'sass:dev',
    'autoprefixer',
    'jade2js',
    'autoBundleDependencies',
    'generateConfigs',
    'browserify:watch',
    'jade:compile',
    'browserSync',
    'concurrent'
  ]);
  grunt.registerTask('no-bs', [ // No browser sync
    'bgShell:npm-install',
    'copy',
    'sass:dev',
    'autoprefixer',
    'jade2js',
    'jshint:dev',
    'autoBundleDependencies',
    'generateConfigs',
    'browserify:watch',
    'jade:compile',
    'concurrent:devNoBS'
  ]);
  grunt.registerTask('server', [
    'copy',
    'sass:dev',
    'autoprefixer',
    'jade2js',
    'jshint:dev',
    'autoBundleDependencies',
    'generateConfigs',
    'browserify:watch',
    'jade:compile',
    'browserSync',
    'concurrent'
  ]);
  grunt.registerTask('deploy', [
    'copy',
    'sass:dev',
    'autoprefixer',
    'jade2js',
    'autoBundleDependencies',
    'generateConfigs',
    'browserify:once',
    'uglify:app',
    'jade:compile'
  ]);
  grunt.registerTask('deploy:prod', [
    'copy',
    'sass:compile',
    'autoprefixer',
    'jade2js',
    'autoBundleDependencies',
    'generateConfigs:production',
    'browserify:once',
    'uglify:app',
    'jade:compile',
    's3:build'
  ]);
  grunt.registerTask('deploy:prod-local', [
    'copy',
    'sass:dev',
    'autoprefixer',
    'jade2js',
    'autoBundleDependencies',
    'generateConfigs:production',
    'browserify:once',
    'uglify:app',
    'jade:compile'
  ]);
  grunt.registerTask('deploy:staging', [
    'copy',
    'sass:dev',
    'autoprefixer',
    'jade2js',
    'autoBundleDependencies',
    'generateConfigs:staging',
    'browserify:once',
    'jade:compile'
  ]);
};
