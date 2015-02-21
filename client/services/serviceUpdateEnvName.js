'use strict';

require('app')
  .factory('updateEnvName', updateEnvName);
/**
 * @param instance instance that was just changed
 * @param newName the new name the instance took
 * @param items [{ instance: {}, opts: { name, env } }]
 * @returns {*}
 */

/**
 * This goes through an instance and all of it's dependencies, changing any relevant env variables
 * with a new name.
 * @returns {Function}
 */
function updateEnvName(
  keypather,
  regexpQuote,
  configUserContentDomain
) {
  return function (items) {
    function createUrl(instance) {
      var urlParts = keypather.get(instance, 'containers.models[0].urls(%)[0]', configUserContentDomain).split(':');
      // These urls should always be http://url:port, so all we need is the middle
      // urlParts[1].slice(2) to remove the // left over from http://
      return  (/http/.test(urlParts[0])) ? urlParts[1].slice(2) : urlParts[0];
    }
    function makeRegexp(url) {
      //                  Checks for the = and http(s)
      // do it like this so the first match ($1) is always the same
      return new RegExp('(=\\s*|=\\s*(\\w*:){1,2}\/\/)' + regexpQuote(url), 'gim');
    }

    if (!items || !items.length) {
      return false;
    }

    items.forEach(function (itemToModifyEnvs) {
      if (keypather.get(itemToModifyEnvs, 'attrs.env')) {
        var modifiedEnvs = itemToModifyEnvs.attrs.env.join('\n');
        items.forEach(function (itemWithModifiedName) {
          if (keypather.get(itemWithModifiedName, 'opts.name') &&
              keypather.get(itemWithModifiedName.instance, 'containers.models[0].urls(%).length', configUserContentDomain)) {
            var url = createUrl(itemWithModifiedName.instance);
            var regex = makeRegexp(url);
            if (regex.test(modifiedEnvs)) {
              var newUrl = url.replace(new
                  RegExp(regexpQuote(itemWithModifiedName.instance.attrs.name), 'i'),
                  itemWithModifiedName.opts.name).toLowerCase();
              modifiedEnvs = modifiedEnvs.replace(regex, '$1' + newUrl);
            }
          }
        });
        keypather.set(itemToModifyEnvs, 'opts.env', modifiedEnvs.split('\n').filter(function (n) {
          return n.length;
        }));
      }
    });
    return true;
  };
}
