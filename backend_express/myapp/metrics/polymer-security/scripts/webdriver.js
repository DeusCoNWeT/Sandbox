var drive = require('chromedriver');
var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var EXTENSION_PATH = './extension.crx';

var WebDriver = function () {

  function WebDriver(options) {
    this.options = options || new chrome.Options().addExtensions(EXTENSION_PATH);
    this.driver = new webdriver.Builder()
      .withCapabilities(this.options.toCapabilities())
      .build();
  }

  WebDriver.prototype.open = function(url){
    return this.driver.get(url);
  };

  WebDriver.prototype.close = function(url){
    return this.driver.quit();
  };
  
  return WebDriver;
};

module.exports = WebDriver();