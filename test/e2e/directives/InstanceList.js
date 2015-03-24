'use strict';

var util = require('../helpers/util');

function InstanceList() {

  this.searchForInstance = function (searchQuery) {
    element(by.css('.nav-servers input')).sendKeys(searchQuery);
  };
  this.getFilteredInstances = function(){
    return element.all(by.css('.nav-servers .list .list-item'));
  }
}


module.exports = InstanceList;
