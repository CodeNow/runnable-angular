require('app')
  .filter('buildStreamCleaner', buildStreamCleaner);
/**
 * @ngInject
 */
function buildStreamCleaner() {
  return function (stream) {
    return parseReturns(stream);
  };
}

function parseReturns(data) {
  if (!data) {
    return null;
  }
  // Split the data by the \n.
  var splitData= data.split('\n');
  var parsedData= '';
  // Each of the strings in the array may have a \r at the end of them
  splitData.forEach(function (line, index){
    if (line) {
      var startCheck = 0;
      // Remove all \r from the beginning of the line
      while(line.charAt(startCheck) === '\r') {
        startCheck++;
      }
      var firstReturn = line.indexOf('\r', startCheck);
      // If the first found return is at the end, or not in it at all, then skip this
      if (line && firstReturn !== -1) {
        // remove the \r from the end of the line
        var endCheck = line.length - 1;
        while (line.charAt(endCheck) === '\r') {
          endCheck--;
        }
        var lastIndex= line.lastIndexOf('\r', endCheck);
        // Now find the last index (which isn't at the beginning or end), and cut off
        // everything before it
        if (lastIndex > 0) {
          // +1 for the last letter, + 1 for the \r at the end
          line = line.slice(lastIndex + 1, endCheck + 2);
        }
      }
      // Since split will cause the last item to be an empty string
      // if the last character was a \n, we add \ns only when this is NOT the
      // last item.  If the last item isn't empty, then it didn't have a \n at
      // the end
      parsedData += line + ((index !== splitData.length -1) ? '\n' : '');
    }
  });
  return parsedData || data;
}