require('app')
  .factory('updateEnvName', updateEnvName);
/**
 * Make copies of all of the dependent instances, then finally the given one.
 * (working backward through the list to minimize fixing dependencies)
 *
 * Create instance url map
 *
 * For each instance.dependency
 *  for each url in map -> replace key with object in env
 *  keep og url
 *  fork instance
 *    > update instance with new name, updated envs
 *      > store og/new url in instance url map
 *
 * @param instance instance that was just changed (should contain
 * @param rootInstance root instance (which is being forked) with all of the dependent instances
 * @returns {*}
 */


/**
 * This takes in an instance with a new name on its state, and changes all of the envs that have
 * it as a
 * @param keypather
 * @param regexpQuote
 * @returns {Function}
 */
function updateEnvName(
  keypather,
  regexpQuote
) {
  return function (instance, newName, oldName, rootInstance) {
    if (!newName || !oldName || newName === oldName) { return false; }

    function createUrl(instance) {
      var urlParts = instance.containers.models[0].urls()[0].split(':');
      // These urls should always be http://url:port, so all we need is the middle
      // urlParts[1].slice(2) to remove the // left over from http://
      var url = (/http/.test(urlParts[0])) ? urlParts[1].slice(2) : urlParts[0];
      if (instance.attrs.name !== oldName) {
        // If the name has already been changed, change the url to have the old name
        url = url.replace(new RegExp(regexpQuote(instance.attrs.name), 'i'), oldName);
      }
      return url;
    }
    function makeRegexp(url) {
      //                  Checks for the = and http(s)
      // do it like this so the first match ($1) is always the same
      return new RegExp('(=\\s*|=\\s*https?:\/\/)' + regexpQuote(url), 'gim');
    }

    if (!rootInstance || !instance || !rootInstance.dependencies ||
        !keypather.get(instance, 'containers.models[0].urls().length')) {
      return false;
    }
    var url = createUrl(instance);
    var regex = makeRegexp(url);
    var newUrl = url.replace(new RegExp(regexpQuote(oldName), 'i'), newName).toLowerCase();
    var instancesArray = [rootInstance].concat(rootInstance.dependencies.models);
    instancesArray.forEach(function (dependency) {
      var envs = keypather.get(dependency, 'state.env') || dependency.attrs.env;
      if (envs) {
        // Flatten out the array so we can regex all at once
        var fixedEnvs = envs.join('\n').replace(regex, '$1' + newUrl);
        // Add the new envs into the state object
        keypather.set(dependency, 'state.env', fixedEnvs.split('\n').filter(function (n) {
          return n.length;
        }));
      }
    });
    return true;
  };
}
