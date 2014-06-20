module.exports = urlJoin;

function urlJoin (/* urlParts */) {
  var urlParts = Array.prototype.slice.call(arguments);

  return urlParts.join('/').replace(/([^:])([\/]{2,})/g, '$1/');
}