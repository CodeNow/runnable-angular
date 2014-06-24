var grunt = require('grunt');

exports.jade = {
  basic: function(test) {
    'use strict';
    test.expect(1);

    var actual = grunt.file.read('tmp/basic.js');
    var expected = grunt.file.read('test/expected/basic.js');
    test.equal(actual, expected, 'should compile Jade templates into JavaScript file');

    test.done();
  },
  amd: function(test) {
    'use strict';
    test.expect(1);

    var actual = grunt.file.read('tmp/amd.js');
    var expected = grunt.file.read('test/expected/amd.js');
    test.equal(actual, expected, 'should compile Jade templates into JavaScript file with AMD support');

    test.done();
  }
};
