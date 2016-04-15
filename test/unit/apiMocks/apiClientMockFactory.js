'use strict';

module.exports = {
  contextVersion: function (user, json) {
    return user.newContext({ _id: json.context }).newVersion(json,
      {noStore: true});
  },
  build: function (user, json) {
    return user.newBuild(
      json,
      {noStore: true}
    );
  }
};
