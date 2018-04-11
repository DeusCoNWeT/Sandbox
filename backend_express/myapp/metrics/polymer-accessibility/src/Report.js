var plato = require('plato');
var phantom = require('phantom');
var fs = require("fs");
var async = require("async");
var log4js = require('log4js');
var logger = log4js.getLogger('Report');
var Utils = require('./Utils');
var connect = require('connect');
var serveStatic = require('serve-static');

var WCAG2A_RULES = require('../wcag_norms/WCAG2A');
var WCAG2AA_RULES = require('../wcag_norms/WCAG2AA');
var WCAG2AAA_RULES = require('../wcag_norms/WCAG2AAA');
var A11Y_RULES = require('../wcag_norms/A11y');

var WEIGHT = require('../wcag_norms/weight');
var CATEGORY = require('../wcag_norms/categories');
var CATEGORY_TOTAL = CATEGORY.length;
var WCAG2A_TOTAL = WCAG2A_RULES.length;
var WCAG2AA_TOTAL = WCAG2AA_RULES.length;
var WCAG2AAA_TOTAL = WCAG2AAA_RULES.length;
var A11Y_TOTAL = A11Y_RULES.length;
var EXP_ID;


module.exports = exports = function () {
  var Report = {};
  var server;
  var program;
  var page;
  var failed = 0;
  var _baseColor = {
    notice: '\x1b[1;34m',
    error: '\x1b[1;31m',
    warning: '\x1b[1;33m',
    pass: '\x1b[1;32m'
  };

  var COLOR = {
    NOTICE: _baseColor.notice + 'NOTICE\x1b[0m',
    ERROR: _baseColor.error + 'ERROR\x1b[0m',
    WARNING: _baseColor.warning + 'WARNING\x1b[0m',
    PASS: _baseColor.pass + 'PASS\x1b[0m'
  };
  var ORDER = {
    ERROR: 1,
    WARNING: 2,
    NOTICE: 3,
    PASS: 4
  };
  var errors = { ERROR: [], NOTICE: [], WARNING: [], PASS: [] };


  /**
   * 
   * @param {String} path Path of component that will be analyzed. Must be an html file
   * @param {Object} options Config options. 
   *       {
   *         "recursive": false // Analyze all script files or only the script inside component file.  
   *       }
   */
  Report.analyze_file = function (file, component_name) {
    return new Promise(function (resolve, reject) {
      Report._resolve = resolve;
      Report._reject = reject;

      connect().use(serveStatic(program.root || __dirname + '/..')).listen(program.port || 8080, function (a) {
        logger.info('Server running on ' + program.port + '...');
        Report._server = this;

        phantom.create(['--web-security=no', '--ssl-protocol=any', '--ignore-ssl-errors=true']).then(function (instance) {
          Report._phInstance = instance;
          return instance.createPage();
        }).then(function (sitepage) {
          page = sitepage;


          // Set viewport size
          page.property('viewportSize', program.viewport);


          // Take report form console
          page.on('onConsoleMessage', Report.parseConsoleMsg);

          // Load libraries and execute a11y test
          page.on('onLoadFinished', Report.onLoadFinishCb);
          page.on('onCallback', Report.customMsgCallback);
          // Check console errors
          page.on("onResourceError", function (request) {
            if (!program.skip_errors)
              logger.error(request);
          });

          // Check page errors
          page.on("onError", function (request) {
            logger.error("Error cannot be opened\t" + request.status + ": " + request.statusText);
            reject(request);
          });

          logger.info('Open ', file);
          return page.open(file);
        });
      });
    })
  }

  /**
   * Generate a report file based on analyze report of a component
   * @param {Object} report Report produced by analyze
   * @param {String} output Path to output folder
   * @param {String} name Name of the output file that will be generated
   */

  Report.parseConsoleMsg = function (msg, lineNum, sourceId) {
    var result_split, report;
    if (msg.match(/\[HTMLCS\]/)) {
      result_split = msg.split('|');
      var norm_split = result_split[1].split(".");
      var norm;
      var weight;
      var category;
      if (norm_split.length > 0) {
        norm = norm_split.slice(0, 4).join(".");
        weight = WEIGHT[norm_split.slice(1, 4).join(".")];
      }
      report = {
        type: result_split[0].split(" ")[1],
        principle: '[' + result_split[1] + ']',
        norm: norm,
        weight: weight.weight,
        category: weight.category,
        tag: result_split[2],
        tag_id: result_split[3],
        error: result_split[4],
        full_tag: result_split[5],
        full_text: msg
      };
      errors[report.type].push(report);
    } else if (msg.match(/\[AXS\]/)) {
      result_split = msg.split('|');
      var type = result_split[0].split(" ")[1].toUpperCase();
      var norm_split = result_split[1];
      var norm;
      var weight;
      if (norm_split.length > 0) {
        norm = norm_split.split('.')[0];
        weight = WEIGHT[norm];
      }
      if (type !== 'PASS') {
        report = {
          type: type,
          norm: norm,
          weight: weight.weigth,
          category: weight.category,
          principle: result_split[1],
          tag: '<' + result_split[2] + '>',
          tag_id: result_split[3],
          error: result_split[4],
          full_tag: result_split[5]
        };
      } else {
        report = {
          type: type,
          principle: result_split[1],
          norm: norm,
          error: result_split[4]
        };
      }
      errors[report.type].push(report);
    } else {
      logger.debug(msg);
    }
  };
  Report.onLoadFinishCb = function () {
    logger.debug('Cargando dependencias para evaluar la usabilidad');
    page.injectJs(__dirname + '/../vendor/geolocation.js');
    if (program.wcag2) page.injectJs(__dirname + '/../vendor/HTMLCS.js');
    if (program.a11y) page.injectJs(__dirname + '/../vendor/axs_testing.min.js');
    logger.debug('Injectando la espera de tiempo y a que los components esten ready');
    evaluate(page, function (timeout, wcag2, config) {
      document.addEventListener('WebComponentsReady', function () {
        window.setTimeout(function () {
          window.callPhantom({ text: 'Antes de llamar a las auditorias', type: 'DEBUG' });
          //window.callPhantom({ text: 'Probando ---> ' + document.querySelector('reddit-timeline').children, type: 'DEBUG' });
          // check if wcag2 is disable
          if (config.wcag2) {
            window.callPhantom({ text: 'WCAG2' + wcag2, type: 'DEBUG' });
            window.HTMLCS_RUNNER.run('WCAG2' + wcag2);
          }
          // Check if a11y is disabled
          if (config.a11y) {
            window.callPhantom({ text: "A11Y test", type: "DEBUG" });
            var audit = axs.Audit.run();
            audit.forEach(function (item) {
              var result = "[AXS] ";
              if (item.rule.severity.toUpperCase() == 'SEVERE') {
                item.rule.severity = 'ERROR';
              }
              if (item.result == 'FAIL') {
                result += item.rule.severity; // TYPE
                result += item.rule && item.rule.code ? '|' + item.rule.code + '.' + item.rule.name : '|'; // principle
                result += item.elements.length > 0 ? '|' + item.elements[0].tagName : '|'; // tag
                result += item.elements.length > 0 && item.elements[0].id ? item.elements[0].id : '|'; //tag_id
                result += item.rule && item.rule.heading ? '|' + item.rule.heading : '|'; // error
                if (item.elements.length > 0) {
                  var outerHTML = item.elements[0].outerHTML;
                  var list = "";
                  if (item.rule.name == 'lowContrastElements') {
                    var splited = outerHTML.split('\n');
                    list = splited.join('\n     ');
                  } else {
                    outerHTML = outerHTML.replace(/<!--[\s\S]*?-->/g, "");
                    outerHTML = outerHTML.split('>');
                    list = outerHTML[0] + ">";
                    list += outerHTML.length > 1 ? outerHTML[1] + '>' : '';
                    list += outerHTML.length > 2 ? outerHTML[2] + '>' : '';
                    var close = list.split('>').reverse();
                    close.splice(0, 1);
                    close = close.join('>') + '>';
                    close = close.replace(/</g, '</');
                    list = list + close;
                  }
                  result += '|' + list;
                }
                console.log(result);
              } else if (item.result == 'PASS') {
                result += item.result;
                result += item.elements.length > 0 ? '|' + item.elements[0].tagName : '|'; // tag
                result += item.rule.code + '.' + item.rule.name;
                result += '||';
                result += '|' + item.rule.heading;
                console.log(result);
              }
            });
          }
          window.callPhantom({ type: 'ACCESSIBILITY_AUDIT' });
          window.callPhantom({ type: 'CLOSE' });
        }, timeout);
      }, false);
    }, program.timeout, program.wcag2_level, { a11y: program.a11y, wcag: program.wcag2 });
  };
  Report.customMsgCallback = function (msg) {
    switch (msg.type) {
      case 'ACCESSIBILITY_AUDIT':
        errors.ERROR = Utils.removeRepeted(errors.ERROR);
        errors.WARNING = Utils.removeRepeted(errors.WARNING);
        errors.NOTICE = Utils.removeRepeted(errors.NOTICE);
        errors.PASS = Utils.removeRepeted(errors.PASS);
        errors = Utils.remoteRepetedByLevel(errors);
        //printAllReport(errors);
        // if (!program.skip || program.brief) { 
        //   if (!program.nomixpanel) {

        //     sendToMixpanel(errors, component_name);
        //   }

        var warning = errors.WARNING.length;
        //var errors = list_errors.ERROR.length + Math.floor(warning / program.config.errorsByWarning);
        var errores = {};
        errors.ERROR.forEach(function (norm) {
          if (errores[norm.category] === undefined) {
            errores[norm.category] = 1;
          }
          else {
            errores[norm.category] += 1;
          }
        });
        var pass = errors.PASS.length;
        var usability_val;
        var sum = 0;
        var i; if (program.output) {

          // check if output file is empty
          var content_file = "";
          logger.info("Saving results in " + program.output);
          fs.readFile(program.output, 'utf8', function (err, content) {
            if (err) {
              logger.error("Error reading the output file", err);

            } else {
              content_file = content;
              if (content_file == "") {
                var data = {};
                data[component_name] = errors;
                fs.writeFile(program.output, JSON.stringify(data, null, 2), function (err) {
                  if (err) logger.error('Trying to write output file', err);
                  logger.info('Generated report in ', program.output);
                  endConection(Report._phInstance, failed);
                });
              } else {
                content_file = JSON.parse(content_file);
                content_file[component_name] = errors;
                fs.writeFile(program.output, JSON.stringify(content_file, null, 2), function (err) {
                  if (err) logger.error('Trying to write output file', err);
                  logger.info('Generate report: ', program.output);
                  endConection(Report._phInstance, failed);
                });
              }
            }
          });
        } else {
          endConection(Report._phInstance, failed);
        }

        for (i = 0; i < CATEGORY_TOTAL; i++) {
          var numItemCat = CATEGORY[i].items.length;
          var errCat = errores[i] || 0;
          sum += (Math.max(0, numItemCat - errCat * CATEGORY[i].weigth)) / numItemCat;
        }

        usability_val = sum / CATEGORY_TOTAL;

        Report._usability_val = {
          value: usability_val,
          errors: errors
        };
        break;
      case 'CLOSE':
        Report.finishAnalyze()
        break;
      default:
        logger.debug(msg.text);
        break;
    }
  };
  Report.printError = function (item) {
    if (!program.skip && !program.brief) {
      failed++;
      if (item.type !== 'PASS') {
        console.log('\t', COLOR[item.type]);
        console.log('\t\t', item.principle);
        console.log('\t\t', item.tag, ' ', item.tag_id);
        console.log('\t\t', item.error);
        console.log('\t\t', item.full_tag, '\n');
      } else if (item.type === 'PASS') {
        console.log('\t', COLOR[item.type]);
        console.log('\t\t', item.principle);
        console.log('\t\t', item.error);
      }
    }
  };
  Report.printAllReport = function (result, component_name) {
    var errors = result.errors;
    if (!program.skip && !program.brief) {
      console.log('ACCESSIBILITY REPORT');
      console.log('-----------------------------------------\n');
      for (var type in errors) {
        if (errors.hasOwnProperty(type)) {
          errors[type].forEach(Report.printError);
        }
      }
    }
    var report = "(" + _baseColor.error + errors.ERROR.length + '\x1b[0m/';
    report += _baseColor.warning + errors.WARNING.length + '\x1b[0m/';
    report += _baseColor.notice + errors.NOTICE.length + '\x1b[0m/';
    report += _baseColor.pass + errors.PASS.length + '\x1b[0m)';
    console.log(component_name, '\n\tFINAL REPORT' + report + '\n');
    console.log("Metric value: ", Report._usability_val.value)
  }
  Report.generateReport = function (errors, component_name, path) {
    if (program.output) {

      // check if output file is empty
      var content_file = "";
      logger.info("Saving results in " + path);
      fs.readFile(path, 'utf8', function (err, content) {
        if (err) {
          logger.error("Error reading the output file", err);

        } else {
          content_file = content;
          if (content_file == "") {
            var data = {};
            data[component_name] = errors;
            fs.writeFile(path, JSON.stringify(data, null, 2), function (err) {
              if (err) logger.error('Trying to write output file', err);
              logger.info('Generated report in ', path);
            });
          } else {
            content_file = JSON.parse(content_file);
            content_file[component_name] = errors;
            fs.writeFile(path, JSON.stringify(content_file, null, 2), function (err) {
              if (err) logger.error('Trying to write output file', err);
              logger.info('Generate report: ', path);
            });
          }
        }
      });
    }
  }

  Report.finishAnalyze = function () {
    Report._resolve({ errors: errors, value: Report._usability_val });
    errors = { ERROR: [], NOTICE: [], WARNING: [], PASS: [] };
    Report._server = undefined;
  }

  function evaluate(page, func) {
    var args = [].slice.call(arguments, 2);
    var fn = "function() { return (" + func.toString() + ").apply(this, " + JSON.stringify(args) + ");}";
    return page.evaluate(fn);
  }
  function endConection(phInstance, server) {
    logger.info('Closing server and Phantomjs');
    var closed = 0;
    var timeout = setTimeout(function () {
      if (!closed) {
        logger.debug("Se tiene que cerrar el servidor con timeout");
        Report.finishAnalyze();
      }
    }, 2000);
    Report._server.close(function () {
      logger.debug('Server closed');
      closed = 1;
      Report.finishAnalyze(failed > 0 ? 1 : 0);
    }, function (err) {
      closed = 1;
      logger.error("Error al cerrar el servidor", err);
      Report._reject(err);
    });
    phInstance.exit(1);
  }

  Report._setReportLevel = function (level) {
    logger.setLevel(level);
  }
  Report._setProgram = function (conf) {
    program = conf;
  }
  return Report;

}();