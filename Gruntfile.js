module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: "\n"
      },
      dist: {
        src: [
          'bower/twitter/dist/css/bootstrap.min.css',
          'bower/twitter/dist/css/bootstrap-theme.min.css',
          'client/css/search.css',
          'client/css/space.css',
          'client/css/signup.css',
          'client/css/style.css'
        ],
        //dest: 'public/build/<%= pkg.name %>.css'
        dest: 'public/build/bundle.css'
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
      main: {
        expand: true,
        cwd: 'bower/twitter/dist/fonts/',
        src: '**',
        dest: 'public/fonts/',
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
        '!client/build/**/*.*'
      ],
      tasks: ['jade2js', 'execute:indexFiles', 'browserify', 'execute:cleanFiles']
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

  //grunt.registerTask('server', ['concat', 'copy', 'browserify', 'bgShell:server', 'watch']);
  //grunt.registerTask('default', ['concat', 'copy', 'browserify']);
  grunt.registerTask('default', ['browserify']);

};