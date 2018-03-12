var get_comp_serv = require('../services/component_service');
var handler = {
    getComponents: function (req, res) {
        // hacer comprobaciones
        res.send({
            verb: "get"
        });
    },
    getComponent: function (req, res) {
        var id = req.params.name;
        if (!id) {
            res.send(error)
        }
        // Using Promises
        get_comp_serv.get_component(id).then(function (properties) {
            res.status(200).send(properties);
        }, function (err) { 
            res.send(err).status(400);
        });
    },
    postProperties: function (req, res) {
        if(!req.body){
            console.log('Object missing')
        }
        res.send({
            verb: "post"
        });
    }
}

module.exports = handler;