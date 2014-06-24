module.exports = (grunt) ->
  'use strict'

  grunt.initConfig
    jade2js:
      basicTest:
        files:
          'tmp/basic.js': 'test/fixtures/basic.jade'

        options:
          namespace: 'MyApp.Templates'
          includeRuntime: false

      amdTest:
        files:
          'tmp/amd.js': 'test/fixtures/basic.jade'

        options:
          amd: true
          amdDependences:
            underscore: '_'
            'helpers/helper': 'helper'

    clean:
      test: 'tmp'

    nodeunit:
      tasks: ['test/*_test.js']

  grunt.loadTasks 'tasks'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks('grunt-contrib-nodeunit')

  grunt.registerTask 'test', ['clean', 'jade2js', 'nodeunit']
  grunt.registerTask 'default', ['test']
