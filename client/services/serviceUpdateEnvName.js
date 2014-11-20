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
  return function (instance, rootInstance) {

    function makeRegexp(instanceName) {
      //                  Checks for the = and http(s)
      // do it like this so the first match ($1) is always the same
      return new RegExp('(=\\s*|=\\s*https?:\/\/)' + regexpQuote(instanceName) +
        '(\\.[^.]*\\.runnable\\.io|runnable3\\.net)', 'gim');
      //    Checks for a .SOMETHING. then either runnable.io or runnable3.net
    }

    if (!rootInstance || !instance || !rootInstance.dependencies ||
        !keypather.get(instance, 'state.name')) {
      return false;
    }
    var regex = makeRegexp(instance.attrs.name);
    var newName = instance.state.name;
    var instancesArray = [rootInstance].concat(rootInstance.dependencies.models);
    instancesArray.forEach(function (dependency) {
      var envs = keypather.get(dependency, 'state.env') || dependency.attrs.env;
      if (envs) {
        // Flatten out the array so we can regex all at once
        var fixedEnvs = envs.join('\n').replace(regex, '$1' + newName + '$2');
        // Add the new envs into the state object
        keypather.set(dependency, 'state.env', fixedEnvs.split('\n').filter(function (n) {
          return n.length;
        }));
      }
    });
    return true;
  };
}
