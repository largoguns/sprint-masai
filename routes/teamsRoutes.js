const express = require('express');
const router = express.Router();
const Datastore = require('nedb');
const { log, error } = require('../logconsole'); // Importa las funciones


const db = new Datastore({ filename: 'data/teams.db', autoload: true });

router.get('/', (req, res) => {
    db.find({}).sort({ job:1, name: 1 }).exec((err, teams) => {
        if (err) {
            res.status(500).json({ error: err });
        } else {
            res.json(teams);
        }
    });
});

router.get('/:name', (req, res) => {
    const name = req.params.name;

    db.find({ name: new RegExp(name, 'i') }, (err, users) => {
        if (err) {
            res.status(500).json({ error: err });
        } else {
            if (users.length === 0) {
                res.status(404).json({ error: 'Usuario no encontrado' });
            } else {
                res.json(users);
            }
        }
    });
});

router.post('/', (req, res) => {
    const newTeam = req.body;
    
    db.findOne({ name: newTeam.name }, (err, existingTeam) => {
        if (err) {
            res.status(500).json({ error: err });
        } else if (existingTeam) {
            res.status(400).json({ error: 'El nombre de equipo ya existe' });
        } else {
            db.insert(newTeam, (err, team) => {
                if (err) {
                    res.status(500).json({ error: err });
                } else {
                    res.status(201).json(team);
                }
            });
        }
    });
});

router.put('/:id', (req, res) => {
    const teamID = req.params.id;
    const updatedTeam = req.body;
    db.update({ _id: teamID }, { $set: updatedTeam }, {}, (err, numReplaced) => {
        if (err) {
            res.status(500).json({ error: err });
        } else if (numReplaced === 0) {
            res.status(404).json({ error: 'Equipo no encontrado' });
        } else {
            res.sendStatus(204);
        }
    });
});

router.delete('/all', (req, res) => {
    db.remove({}, { multi: true }, (err, numRemoved) => {
        if (err) {
            res.status(500).json({ error: err });
        } else if (numRemoved === 0) {
            res.status(404).json({ error: 'Equipo no encontrado' });
        } else {
            res.sendStatus(204);
        }
    });
});

router.delete('/:id', (req, res) => {
    const teamID = req.params.id;
    db.remove({ _id: teamID }, {}, (err, numRemoved) => {
        if (err) {
            res.status(500).json({ error: err });
        } else if (numRemoved === 0) {
            res.status(404).json({ error: 'Equipo no encontrado' });
        } else {
            res.sendStatus(204);
        }
    });
});


module.exports = router;