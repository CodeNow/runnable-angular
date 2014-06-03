var path = require('path');
var _    = require('underscore');

module.exports = function(grunt) {

  var sassDir   = 'client/scss';
  var sassIndex = path.join(sassDir, 'index.scss');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
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
          'client/styles/bootstrap/bootstrap.min.css',
          'client/styles/bootstrap/bootstrap-theme.min.css',
          //ngprogress?
          'client/styles/glyphicons.css',
          'client/styles/jquery-ui/jquery-ui-1.10.4.custom.css',
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
            './client/views/**/*.jade'
          ]
        }
      }
    },
    copy: {
      images: {
        expand: true,
        cwd: 'client/images/',
        src: '**',
        dest: 'client/build/images/',
        flatten: true,
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
      files: [
        'client/**/*.js',
        'client/**/*.jade',
        'client/**/*.scss',
        '!client/build/**/*.*'
      ],
      tasks: ['jade2js', 'sass', 'concat', 'execute:indexFiles', 'browserify', 'execute:cleanFiles']
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

  //grunt.registerTask('server', ['concat', 'copy', 'browserify', 'bgShell:server', 'watch']);
  //grunt.registerTask('default', ['concat', 'copy', 'browserify']);
  grunt.registerTask('default', ['copy:images', 'jade2js', 'sass', 'concat', 'browserify', 'watch']);

};