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
            res.status(201).send(properties);
        }, function (err) { 
            res.send(err).status(404);
        });
    },
    postProperties: function (req, res) {
        if(!req.body){
            console.log('Object missing')
        }
        var object_tokens = req.body;
        console.log(object_tokens);
        get_comp_serv.analize_metric(object_tokens).then(function (quality) {
            res.status(201).json(quality);
        }, function (err) { 
            res.send(err).status(404);
        });;
    }
}

module.exports = handler;