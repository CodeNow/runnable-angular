var path = require('path');
var _    = require('underscore');
var find = require('find');
var fs   = require('fs');

module.exports = function(grunt) {

  var sassDir   = 'client/assets/styles/scss';
  var sassIndex = path.join(sassDir, 'index.scss');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
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
          //ngprogress?
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
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
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
          transform: ['browserify-shim'],
          alias: [
            'client/lib/app:app',
            'client/config/routes:config/routes',
            'client/config/api:config/api'
          ]
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
          'client/assets/images/*'
        ],
        tasks: ['copy:images']
      },
      javascripts: {
        files: [
          'client/**/*.js',
          '!client/build/**/*.*'
        ],
        tasks: ['browserify']
      },
      templates: {
        files: [
          'client/**/*.jade',
          '!client/build/**/*.*'
        ],
        tasks: [
          'jade2js',
          'browserify'
        ]
      },
      styles: {
        files: [
          'client/**/*.scss',
          'client/**/*.css',
          '!client/build/**/*.*'
        ],
        tasks: ['sass:dev', 'concat', 'autoprefixer']
      }
    },
    bgShell: {
      server: {
        cmd: 'NODE_ENV=development NODE_PATH=. node ./node_modules/nodemon/bin/nodemon.js -e js,hbs index.js',
        bg: true,
        execOpts: {
          maxBuffer: 1000*1024
        }
      }
    }
  });

  grunt.registerTask('autoBundleDependencies', '', function () {
    var done       = this.async();
    var clientPath = path.join(__dirname, 'client');
    bundle('controllers');
    bundle('services');
    bundle('filters');
    bundle('directives');
    bundle('animations');
    done();
    function bundle (subDir) {
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
        fs.writeFileSync(path.join(workingPath, 'index.js'), fileString);
      });
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

  grunt.registerTask('build', ['copy', 'sass:dev', 'concat', 'autoprefixer', 'jade2js', 'autoBundleDependencies', 'browserify']);
  grunt.registerTask('develop', ['build', 'concurrent']);


};
