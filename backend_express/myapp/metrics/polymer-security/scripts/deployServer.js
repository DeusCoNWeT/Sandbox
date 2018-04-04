(function () {
  
  var connect = require('connect');
  var serveStatic = require('serve-static');
  var PORT = 3000;
  var HOST = '0.0.0.0';
  var BASE = __dirname;

  var Serv = function () {

    // Constructor

    function Serv(config) {
      config = config || {};
      this.base = config.base || BASE;
      this.port = config.port || PORT;
      this.host = config.host || HOST;
    }

    Serv.prototype.init = function () {
      
      return new Promise(function (resolve, reject) {
        
        this.server = connect().use(serveStatic(this.base)).listen(this.port, this.host, function(){
          console.log('El servidor esta ejecutando');
          resolve();
        });
      }.bind(this));

    };

    // setter
    Serv.prototype.setConfig = function(config) {
      config = config || {};
      this.base = config.base || this.base;
      this.port = config.port || this.port;
      this.host = config.host || this.host;
    };
    
    return Serv;
  };
  module.exports = Serv();
})();