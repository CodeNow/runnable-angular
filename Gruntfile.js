'use strict';

var path    = require('path');
var find    = require('find');
var fs      = require('fs');
var async   = require('async');
var envIs   = require('101/env-is');
var timer   = require('grunt-timer');

module.exports = function(grunt) {
  timer.init(grunt);

  var sassDir   = 'client/assets/styles/scss';
  var sassIndex = path.join(sassDir, 'index.scss');
  var jshintFiles = [
    'Gruntfile.js',
    'client/**/*.js',
    '!client/build/**/*.js',
    '!client/assets/**/*.js',
    'server/**/*.js'
  //  'test/**/*.js'
  ];

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    githooks: {
      all: {
        // 'pre-commit':    'jshint:prod'
        // 'pre-push':      'bgShell:karma'
      //  'post-merge':    'bgShell:npm-install',
      //  'post-checkout': 'bgShell:npm-install'
      }
    },
    concurrent: {
      dev: {
        tasks: ['watch:images', 'watch:javascripts', 'watch:templates', 'watch:styles', 'nodemon'],
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
          browsers: ['last 2 versions']
        },
        files: {
          'client/build/css/index.css' : 'client/build/css/index.css'
        }
      }
    },
    sass: {
      compile: {
        options: {
          style: 'compressed'
        },
        files: {
          'client/build/css/index.css': sassIndex
        }
      },
      dev: {
        options: {
          lineNumbers: true,
          style: 'expanded'
        },
        files: {
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
          'client/build/js/bundle.js': ['client/main.js']
        },
        options: {
          watch: true,
          bundleOptions: {
            debug: true // source maps
          }
        }
      },
      once: {
        files: {
          'client/build/js/bundle.js': ['client/main.js']
        },
        options: {
          bundleOptions: {
            debug: true // source maps
          }
        }
      },
      deploy: {
        files: {
          'client/build/js/bundle.js': ['client/main.js']
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
      },
      fonts: {
        expand: true,
        cwd: 'client/assets/fonts/',
        src: '**',
        dest: 'client/build/fonts/',
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
          'copy:images'
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
          '!client/build/**/*.*'
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
          '!client/build/**/*.*'
        ],
        tasks: [
          'jade2js',
        //  'bgShell:karma'
        ]
      },
      styles: {
        files: [
          'client/**/*.scss',
          'client/**/*.css',
          '!client/build/**/*.*'
        ],
        tasks: [
          'sass:dev',
          'autoprefixer'
        ]
      }
    },
    bgShell: {
      // karma: {
      //   bg: true,
      //   cmd: [
      //     'SAUCE_USERNAME=runnable',
      //     'SAUCE_ACCESS_KEY=f41cc147-a7f0-42b0-8e86-53eb5a349f48',
      //     'BUILD_NUMBER=1',
      //     'karma start ./test/karma.conf.js'
      //   ].join(' ')
      //   //cmd: 'SAUCE_USERNAME=runnable SAUCE_ACCESS_KEY=f41cc147-a7f0-42b0-8e86-53eb5a349f48 BUILD_NUMBER=1 karma start ./test/karma.conf.js'
      // },
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
      protractor: {
        bg: false,
        cmd: 'protractor test/protractor.conf.js'
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
            statements: 68.58,
            branches: 52.01,
            functions: 63.00,
            lines: 68.98
          },
          dir: 'coverage',
          root: 'test'
        }
      }
    }
  });

  grunt.registerTask('autoBundleDependencies', '', function () {
    var done       = this.async();
    var clientPath = path.join(__dirname, 'client');
    async.series([
      bundle('polyfills'),
      bundle('controllers'),
      bundle('services'),
      bundle('filters'),
      bundle('directives'),
      bundle('decorators'),
      bundle('animations')
    ], function () { done(); });

    function bundle (subDir) {
      return (function (subDir) {
        return function (cb) {
          var workingPath = path.join(clientPath, subDir);
          var indexPath = path.join(workingPath, 'index.js');

          find.file(/\.js$/, workingPath, function (files) {
            var newFileString = files
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
                  grunt.log.writeln('writing new', subDir, 'index.js');
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

  grunt.registerTask('generateConfigs', '', function () {
    var done = this.async();
    var clientPath = path.join(__dirname, 'client');
    async.parallel([
      function (cb) {
        var configObj = {};
        configObj.host = process.env.API_HOST || '//stage-api-codenow.runnableapp.com';
        configObj.userContentDomain = process.env.USER_CONTENT_DOMAIN || 'runnableapp.com';

        if (configObj.host.charAt(configObj.host.length-1) === '/') {
          configObj.host = configObj.host.substr(0, configObj.host.length-1);
        }
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
        var configObj = {};
        configObj.environment = process.env.NODE_ENV || 'development';
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
      if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file,index){
          var curPath = path + '/' + file;
          if(fs.lstatSync(curPath).isDirectory()) { // recurse
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



  grunt.registerTask('loadSyntaxHighlighters', '', function () {
    var cb = this.async();
    var indexPath = path.join(__dirname, 'client', 'lib', 'braceModes.js');
    var workingPath = path.join(__dirname, 'node_modules', 'brace', 'mode');

    // TODO: DRY up with code above
    find.file(/\.js$/, workingPath, function (files) {
      var newFileString = files
        .map(function (item) {
          return item.replace(workingPath, 'brace/mode').replace(/\.js$/, '');
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
            grunt.log.writeln('writing new modes.js');
            fs.writeFile(indexPath, newFileString, cb);
          });
        } else {
          grunt.log.writeln('writing new modes.js');
          fs.writeFile(indexPath, newFileString, cb);
        }
      });
    });
  });

  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-bg-shell');
  grunt.loadNpmTasks('grunt-jade-plugin');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-concurrent');

  if (!envIs('production', 'staging')) {
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-githooks');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-istanbul');
    grunt.loadNpmTasks('grunt-istanbul-coverage');
  }

  grunt.registerTask('test:watch', ['bgShell:karma-watch']);
  grunt.registerTask('test:unit', ['bgShell:karma']);

  grunt.registerTask('test:unit-coverage', [
    'deleteOldCoverage',
    'bgShell:karma-circle', // Use the circle karma.conf so it browserifies everything it needs
    'coverage'
  ]);
  grunt.registerTask('test:e2e', ['bgShell:protractor']);
  grunt.registerTask('test', ['bgShell:karma']);
  grunt.registerTask('default', [
    'githooks',
    'bgShell:npm-install',
    'copy',
    'sass:dev',
    'autoprefixer',
    'jade2js',
    'jshint:dev',
    'autoBundleDependencies',
    'generateConfigs',
    'loadSyntaxHighlighters',
    'browserify:watch',
    'concurrent'
  ]);
  grunt.registerTask('deploy', [
    'copy',
    'sass:dev',
    'autoprefixer',
    'jade2js',
    'autoBundleDependencies',
    'generateConfigs',
    'browserify:once'
  ]);

};
