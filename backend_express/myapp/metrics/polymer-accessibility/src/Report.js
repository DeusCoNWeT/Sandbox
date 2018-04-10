var plato = require('plato');
var utils = require('./Utils');
var fs = require("fs");
var async = require("async");

module.exports = exports = (function(){
     
  /**
   * 
   * @param {String} path Path of component that will be analyzed. Must be an html file
   * @param {Object} options Config options. 
   *       {
   *         "recursive": false // Analyze all script files or only the script inside component file.  
   *       }
   */
  Report.analyze = function(path, options){
    return new Promise(function (resolve, reject) {
      console.log('Pasar metricas')
      resolve()
    }.bind(this));
  };
  
  /**
   * Generate a report file based on analyze report of a component
   * @param {Object} report Report produced by analyze
   * @param {String} output Path to output folder
   * @param {String} name Name of the output file that will be generated
   */
  Report.generateReport = function(report, output, name){
   
  };

  return Report;
  })();