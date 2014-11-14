module.exports = directiveTemplate;

function directiveTemplate (templateName, attrs) {
  if (!attrs) {
    attrs = {};
  }
  return [
    '<',
    templateName,
    Object.keys(attrs).reduce(function (str, key) {
      return str + " " + key + '="' + attrs[key] + '"';
    }, ''),
    '>',
    '</'+templateName+'>'
  ].join('');
}