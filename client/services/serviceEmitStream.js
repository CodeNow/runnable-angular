require('app')
  .factory('streams', function() {
    return {
      emit: require('emit-stream'),
      json: require('JSONStream')
    };
  });