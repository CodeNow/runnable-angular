'use strict';

require('app')
  .factory('pageName', function () {
    var title = 'Runnable';
    return {
      title: function () {
        return title;
      },
      setTitle: function (newTitle) {
        title = newTitle;
      }
    };
  });
