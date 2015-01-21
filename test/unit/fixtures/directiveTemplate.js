'use strict';

module.exports = directiveTemplate;

function directiveTemplate (templateName, attrs) {
  if (!attrs) {
    attrs = {};
  }
  return [
    '<',
    templateName,
    Object.keys(attrs).reduce(function (str, key) {
      if (typeof attrs[key] !== 'string' && typeof attrs[key] !== 'boolean') {
        throw new Error('Value must be a string or boolean, got ' + attrs[key]);
      }
      if (key.match(/[A-Z]/)) {
        throw new Error('Key must be in dash-case');
      }
      return str + " " + key + '="' + attrs[key] + '"';
    }, ''),
    '>',
    '</'+templateName+'>'
  ].join('');
}
module.exports.attribute = directiveTemplateAttribute;
function directiveTemplateAttribute (templateName, attrs) {
  if (!attrs) {
    attrs = {};
  }
  return [
    '<button ',
    templateName,
    Object.keys(attrs).reduce(function (str, key) {
      if (typeof attrs[key] !== 'string' && typeof attrs[key] !== 'boolean') {
        throw new Error('Value must be a string or boolean, got ' + attrs[key]);
      }
      return str + " " + key + '="' + attrs[key] + '"';
    }, ''),
    '>',
    '</button>'
  ].join('');
}
