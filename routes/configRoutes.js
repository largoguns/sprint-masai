const express = require('express');
const router = express.Router();
const Datastore = require('nedb');
const axios = require('axios');
const schedule = require('node-schedule');
const { v4: uuidv4 } = require('uuid');

// Crear la base de datos NeDB
const db = new Datastore({ filename: 'data/config.db', autoload: true });

// Verificar y añadir valor por defecto al arrancar
db.find({}, (err, docs) => {
    if (err) {
        console.error('Error al buscar en la base de datos:', err);
    } else {
        if (docs.length === 0) {
            // No hay datos, agregar valor por defecto
            db.insert({ votingLimit: 1, votingStatus: "closed" }, (err, newDoc) => {
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
router.get('/', (req, res) => {
    db.findOne({}, (err, config) => {
        if (err) {
            res.status(500).json({ error: err });
        } else {
            res.json(config);
        }
    });
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

router.get('/votingStatus', (req, res) => {
    db.findOne({}, (err, config) => {
        if (err) {
            res.status(500).json({ error: err });
        } else {
            res.json({ votingStatus: config.votingStatus });
        }
    });
});

router.put('/votingStatus', async (req, res) => {
    const { votingStatus } = req.body;

    db.update({}, { $set: { votingStatus: votingStatus } }, {}, async (err, numReplaced) => {
        if (err) {
            res.status(500).json({ error: err });
        } else {
            res.json({ message: `Estado de la votación actualizada a ${votingStatus}` });
        }
    });
});

router.post('/programVotingEnd', async(req, res) => {
    const { date, time} = req.body;
    const cronExpresion = `${date} ${time}`;

    const id = uuidv4();
    schedule.scheduleJob(id, cronExpresion, () => {    
        db.update({}, { $set: { votingStatus: "closed", taskID: null, votingLimit: null } }, {}, async (err, numReplaced) => {
            if (err) {
                console.log("programVotingEnd - Error", err)
            } else {
                console.log("Periodo de votación finalizado");
            }
        });

        console.log('Periodo de votación finalizado:', new Date());        
    });

    db.update({}, { $set: { taskID: id, votingLimit: `${date} ${time}` } }, {}, async (err, numReplaced) => {
        if (err) {
            res.status(500).json({ error: err });
        } else {
            res.json();
        }
    });

    res.send('Fecha límite de votación actualizada');
});

router.delete('/programVotingEnd', async(req, res) => {

    db.findOne({}, (err, config) => {
        if (err) {
            res.status(500).json({ error: err });
        } else {

            const tareaProgramada = schedule.scheduledJobs[config.taskID];
            if (tareaProgramada) {
              tareaProgramada.cancel();
              console.log('Tarea programada cancelada:', config.taskID);
            } else {
              console.warn('Tarea programada no encontrada:', config.taskID);
            }

            db.update({}, { $set: { taskID: null, votingLimit: null } }, {}, async (err, numReplaced) => {
                if (err) {
                    res.status(500).json({ error: err });
                } else {
                    res.json();
                }
            });       

        }
    });
    
    res.send('Fecha límite de votación actualizada');
});


module.exports = router;
