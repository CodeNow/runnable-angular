var path    = require('path');
var _       = require('underscore');
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
          'client/assets/styles/bootstrap/bootstrap.min.css',
          // 'client/assets/styles/bootstrap/bootstrap-theme.min.css',
          // ngprogress?
          'client/assets/styles/glyphicons.css',
          'client/assets/styles/jquery-ui/jquery-ui-1.10.4.custom.css',
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
          bundleOptions: {
            debug: true
          },
          transform: ['browserify-shim']
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
          'client/assets/images/**/*.svg'
        ],
        tasks: [
          'copy:images',
          'autoSVGO'
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
          '!client/build/**/*.*'
        ],
        tasks: [
          'jshint:dev',
          'autoBundleDependencies',
          'browserify',
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
        cmd: 'echo \'installing dependencies...\n\' && npm install'
      }
    },
    karma: {
      unit: {
        configFile: './test/karma.conf.js'
      }
    },
  });

  grunt.registerTask('autoSVGO', '', function () {
    var done = this.async();
    var buildImgPath = path.join(__dirname, 'client/build/images');
    find.file(/\.svg$/, buildImgPath, function (files) {
      files = files.map(function (file) {
        return (function (file) {
          return function (cb) {
            require('exec')('./node_modules/.bin/svgo ' + file, function (err, out, code) {
              cb(err, {
                file: file,
                out: out
              });
            });
          };
        })(file);
      });
      async.parallel(files, function (err, results) {
        var table = new Table({
          head: ['File', 'SVGO output'],
          colWidths: [80, 50]
        });
        results
          .map(function (file) {
            return [file.file.replace(__dirname, '.'), file.out.replace(/\n/g, ' ').replace(/\r/g, '')];
          })
          .map(function (file) {
            table.push(file);
          });
        //table.push.apply(this, results);
        console.log(table.toString());
        done();
      });
    });
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
          try {
            fs.unlinkSync(path.join(workingPath, 'index.js'));
          } catch (e) {
            //file doesn't exist
          }
          find.file(/\.js$/, workingPath, function (files) {
            var fileString = files
              .map(function (item) {
                return item.replace(workingPath, '.').replace(/\.js$/, '');
              })
              .reduce(function (previous, current) {
                return previous += 'require(\'' + current + '\');\n';
              }, '');

            fileString += '\n';
            fileString += 'module.exports=' + JSON.stringify(files.map(function (item) {
              return item.substr(item.lastIndexOf('/')+1).replace(/\.js$/, '');
            }));
            fileString += ';';
            fs.writeFileSync(path.join(workingPath, 'index.js'), fileString);
            cb();
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
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-githooks');

  grunt.registerTask('test-watch', ['watch:tests']);
  grunt.registerTask('build', ['githooks', 'bgShell:npm-install', 'copy', 'sass:dev', 'concat', 'autoprefixer', 'jade2js', 'jshint:dev', 'autoBundleDependencies', 'browserify']);
  grunt.registerTask('default', ['build', 'concurrent']);

};