var fs = require("fs");
module.exports = exports = function(){
var Utils = {};

//Mapping 
var MAPPING = JSON.parse(fs.readFileSync(__dirname + '/../mapping.json','utf8'));

Utils.repetedInList = function(list,element){
    var repeted = false;
    var wcag;
    var ax;
    if (element.norm.indexOf('AX') != -1) { ax = Utils.translateWCAG2Ax(element.norm); }
    else { wcag = Utils.translateWCAG2Ax(element.norm); }
  
    list.forEach(function(norm){
      if (norm.norm == element.norm || 
         ( wcag && norm.norm.indexOf(wcag) != -1) ||
         (ax && norm.norm.indexOf(ax) != -1) ) {
        repeted = true;
      }
    });
  
    return repeted;
  }
Utils.translateWCAG2Ax = function(element){
    var ax_norm = "";
  
    for (var key in MAPPING){
      if (element.indexOf(MAPPING[key]) != -1 && MAPPING[key]){
        ax_norm = key;
      }
    }
    logger.debug("Se va a transformar " + element + " en " + ax_norm);
    return ax_norm
  }
Utils.translateAx2WCAG = function(element){
    logger.debug("Se va a transformar " + element + " en " + MAPPING[element.toUpperCase()]);
    return MAPPING[element.toUpperCase()];
  }

Utils.remoteRepetedByLevel = function(errors) {

    errors.WARNING = errors.WARNING.filter(function(element){
      return !Utils.repetedInList(errors.ERROR, element);
    });

    errors.NOTICE = errors.NOTICE.filter(function(element){
      return !Utils.repetedInList(errors.ERROR, element) && !Utils.repetedInList(errors.WARNING, element);
    });

    errors.PASS = errors.PASS.filter(function(element){
      return !Utils.repetedInList(errors.ERROR, element) && !Utils.repetedInList(errors.WARNING, element) && !Utils.repetedInList(errors.NOTICE, element);
    });
    
    return errors;
}

/**
 * Remove repeted errors without overwrite the list
 * 
 * @param {Array} list  
 * @returns Error list without elements repeted
 */

Utils.removeRepeted = function(list) {
    var analyzed = [];
    var found = false;
    return list.filter(function (el) {
  
      var repeted = analyzed.indexOf(el.norm) != -1;
      // is A11Y metric
      if (el.norm.indexOf("AX_") != -1 && !repeted) {
        var wcag = Utils.translateAx2WCAG(el.norm);
        if (wcag){
          // Look for wcag name
          analyzed.forEach(function(el){
            if (el.indexOf(wcag) != -1){
              repeted=true;
            }
          });
        }
      }
      else if (!repeted) {
        var ax = Utils.translateWCAG2Ax(el.norm);
        repeted = analyzed.indexOf(ax) != -1  || ax;
      }
      if (!repeted) analyzed.push(el.norm);
      return !repeted;                  
    })
  }

  Utils.checkNorms = function(errors){
    var WCAG2A = true;
    var WCAG2AA = true;
    var WCAG2AAA = true;
    var A11Y = true;
    errors.ERROR.forEach(function(element){
      var principle = element.norm.split('.').slice(1).join('.');
      if (WCAG2A_RULES.indexOf(principle) != -1) WCAG2AAA = false;
      if (WCAG2AA_RULES.indexOf(principle) != -1)  WCAG2AA = false;
      if (WCAG2AAA_RULES.indexOf(principle) != -1)  WCAG2A = false;
      if(element.norm.indexOf('AX') != -1 )       A11Y = false;
    });
    
    return {WCAG2A:WCAG2A,WCAG2AA:WCAG2AA,WCAG2AAA:WCAG2AAA,A11Y:A11Y};
  }
  return Utils;
}();