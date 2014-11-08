module.exports = directiveTemplate;

function directiveTemplate (templateName, attrs) {
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