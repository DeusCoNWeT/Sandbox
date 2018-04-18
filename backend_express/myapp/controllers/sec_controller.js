var get_data_sec = require('../services/security_sec');
var handler_sec = {
    postSecurity: function(req, res){
        if(!req.body){
            console.log('Object missing')
        }
        console.log(req.body);
        res.send("OK");
    }
}

module.exports = handler_sec;