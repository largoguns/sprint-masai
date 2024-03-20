const express = require('express');
const router = express.Router();
const Datastore = require('nedb');
const axios = require('axios');

// Crear la base de datos NeDB
const db = new Datastore({ filename: './data/config.db', autoload: true });

// Verificar y añadir valor por defecto al arrancar
db.find({}, (err, docs) => {
    if (err) {
        console.error('Error al buscar en la base de datos:', err);
    } else {
        if (docs.length === 0) {
            // No hay datos, agregar valor por defecto
            db.insert({ votingLimit: 1 }, (err, newDoc) => {
                if (err) {
                    console.error('Error al agregar valor por defecto:', err);
                } else {
                    console.log('Valor por defecto agregado:', newDoc);
                }
            });
        }
    }
});

// Método GET para obtener el límite de votos
router.get('/votingLimit', (req, res) => {
    db.findOne({}, (err, config) => {
        if (err) {
            res.status(500).json({ error: err });
        } else {
            res.json({ votingLimit: config.votingLimit });
        }
    });
});

// Método PUT para actualizar el límite de votos
router.put('/votingLimit', async (req, res) => {
    const votesAPI = `${req.endpoint}/api/votes/`;
    const { votingLimit } = req.body;

    db.update({}, { $set: { votingLimit: votingLimit } }, {}, async (err, numReplaced) => {
        if (err) {
            res.status(500).json({ error: err });
        } else {
            if (numReplaced != votingLimit) {
                await axios.delete(`${votesAPI}all`);
            }
            res.json({ message: `Número de votos por usuario actualizado a ${votingLimit}` });
        }
    });
});

module.exports = router;