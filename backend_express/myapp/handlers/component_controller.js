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

        get_comp_serv.get_component(id).then(function (properties) {
            //NO SE COMO MANEJAR LA RESPUESTA DEL CALLBACK,
            // NO SE SI MANDAR EL ID
            res.status(200).send(properties);
        }, function (err) { 
            res.send(err).status(400);
        });

        // comprobar id existe
        // llamar a servicio de manera asincrona (utilizar promesas/callback)
        // devolver 400 si no existe, o existen errores y sino 200 y los datos

    },
    createComponents: function (req, res) {
        res.send({
            verb: "post"
        });
    }
}

module.exports = handler;