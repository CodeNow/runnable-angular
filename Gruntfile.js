var path    = require('path');
var find    = require('find');
var fs      = require('fs');
var package = require('./package');
var async   = require('async');
var Table   = require('cli-table');

module.exports = function(grunt) {

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
        'pre-commit':    'jshint:prod',
        'pre-push':      'bgShell:karma',
        'post-merge':    'bgShell:npm-install',
        'post-checkout': 'bgShell:npm-install'
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
    concat: {
      options: {
        separator: "\n"
      },
      dist: {
        src: [
          'client/build/css/index.css'
        ],
        //dest: 'public/build/<%= pkg.name %>.css'
        dest: 'client/build/css/index.css'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    jshint: {
      options: {
        debug: false,
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        },
      },
      prod: {
        files: {src: jshintFiles}
      },
      dev: {
        options: {
          debug: true
        },
        files: {src: jshintFiles}
      }
    },
    browserify: {
      build: {
        files: {
          'client/build/js/bundle.js': ['client/main.js']
        },
        options: {
          watch: true,
          bundleOptions: {
            debug: true // source maps yes
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
            './client/templates/**/*.jade'
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
    execute: {
      indexFiles: {
        call: function (grunt, options, async) {
          var done = async();
          return done();
          // var paths = grunt.file.expand('./client/controllers/**/*.js');
          // grunt.file.write('./client/controllers/requireIndex.json', JSON.stringify(paths));
          // done();
        }
      },
      cleanFiles: {
        call: function (grunt, options, async) {
          var done = async();
          done();
        }
      }
    },
    watch: {
      images: {
        files: [
          'client/assets/images/**/*.jpg',
          'client/assets/images/**/*.jpeg',
          'client/assets/images/**/*.png',
          'client/assets/images/*.svg'
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
          'jshint:dev',
          'autoBundleDependencies',
        //  'bgShell:karma'
        ]
      },
      templates: {
        files: [
          'client/**/*.jade',
          '!client/build/**/*.*'
        ],
        tasks: [
          'jade2js',
          'browserify',
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
          'concat',
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
      server: {
        cmd: 'NODE_ENV=development NODE_PATH=. node ./node_modules/nodemon/bin/nodemon.js -e js,hbs index.js',
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
    }
  });

  grunt.registerTask('autoBundleDependencies', '', function () {
    var done       = this.async();
    var clientPath = path.join(__dirname, 'client');
    async.series([
      bundle('controllers'),
      bundle('services'),
      bundle('filters'),
      bundle('directives'),
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
            fs.readFile(indexPath, 'UTF-8', function (err, fileString) {
              if (err) { return cb(err); }
              if (fileString.trim() === newFileString.trim()) {
                return cb();
              }
              grunt.log.writeln('writing new', subDir, 'index.js');
              fs.writeFile(indexPath, newFileString, cb);
            });
          });
        };
      })(subDir);
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-bg-shell');
  grunt.loadNpmTasks('grunt-jade-plugin');
  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-githooks');
  grunt.loadNpmTasks('grunt-jsbeautifier');

  grunt.registerTask('test:watch', ['watch:tests']);
  grunt.registerTask('test:unit', ['bgShell:karma']);
  grunt.registerTask('test:e2e', ['bgShell:karma']);
  grunt.registerTask('test', ['bgShell:karma']);
  grunt.registerTask('build', [
    'githooks',
    'bgShell:npm-install',
    'copy',
    'sass:dev',
    'concat',
    'autoprefixer',
    'jade2js',
    'jshint:dev',
    'autoBundleDependencies',
    'browserify'
  ]);
  grunt.registerTask('default', ['build', 'concurrent']);

};
