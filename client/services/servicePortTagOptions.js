'use strict';

require('app')
  .factory('portTagOptions', portTagOptions);

function portTagOptions(
  JSTagsCollection,
  errs
) {
  function PortTagOptions() {
    this.breakCodes =  [
      13, // return
      32, // space
      44, // comma (opera)
      188 // comma (mozilla)
    ];
    this.texts = {
      'inputPlaceHolder': 'Add ports here',
      maxInputLength: 5,
      onlyDigits: true
    };
    this.minTagWidth = 120;
    this.tags = new JSTagsCollection([]);

    this.tags.onAdd(this.addTagHandler.bind(this));
  }

  PortTagOptions.prototype.addTagHandler = function (newTag) {
    var tags = this.tags;
    /*!
     * Check for non-allowed chars and ports
     */
    // Remove ports over the max
    if ((newTag.value.match(/[^0-9]/g) !== null) || (parseInt(newTag.value, 10) > 65535)) {
        tags.removeTag(newTag.id);
        // Should I be throwing errors from a service
        errs.handler(new Error('Port is invalid (Above 65,535)'));
    }
    /*!
     * Check for duplicate ports
     */
    // Check that there are no duplicates
    Object.keys(tags.tags).forEach(function (key) {
      var tag = tags.tags[key];
      if (tag && tag.value === newTag.value && tag.id !== newTag.id) {
        // Remove duplicate tag. Perhaps, have a pop-up?
        errs.handler(new Error('No duplicate ports allowed.'));
        tags.removeTag(newTag.id);
      }
    });
  };

  PortTagOptions.prototype.setTags = function (portsStr) {
    // The references to the tags in the DOM is kept alive if create a
    // new JSTagCollection
    var tags = this.tags;
    portsStr = portsStr.replace(/,/gi, '');
    var ports = (portsStr || '').split(' ');
    if (ports.length === 0) {
      // If there are no new ports, don't do anything
      return;
    }
    Object.keys(tags.tags).forEach(function (key) {
      tags.removeTag(key);
    });
    ports.forEach(function (port) {
       tags.addTag(port);
    });
  };

  PortTagOptions.prototype.convertTagsToPortList = function () {
    var tags = this.tags.tags;
    return Object.keys(tags).map(function (key) {
      return tags[key].value;
    });
  };

  return {
    PortTagOptions: PortTagOptions
  };
}
