var util = require('../helpers/util');

function InstancePage () {}

InstancePage.urlRegex = new RegExp(util.processUrl('/runnable-doobie/' + util.regex.shortHash));

module.exports = InstancePage;