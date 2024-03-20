const express = require('express');
const router = express.Router();
const Datastore = require('nedb');

const db = new Datastore({ filename: './data/users.db', autoload: true });

router.get('/', (req, res) => {
    db.find({}).sort({ job:1, name: 1 }).exec((err, users) => {
        if (err) {
            res.status(500).json({ error: err });
        } else {
            res.json(users);
        }
    });
});

router.get('/login/:email', (req, res) => {
    const email = req.params.email;

    db.find({ email }, (err, users) => {
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

router.get('/team/:name', (req, res) => {
    const teamName = req.params.name;

    db.find({ team: teamName }, (err, users) => {
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

router.delete('/team/:name', (req, res) => {
    const teamId = req.params.name;

    db.update({ team: teamId }, { $set: { team: "" }}, { multi: true }, (err, users) => {
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
    const newUser = req.body;
    
    db.findOne({ name: newUser.name }, (err, existingUser) => {
        if (err) {
            res.status(500).json({ error: err });
        } else if (existingUser) {
            res.status(400).json({ error: 'El nombre de usuario ya existe' });
        } else {
            db.findOne({ email: newUser.email }, (err, existingEmailUser) => {
                if (err) {
                    res.status(500).json({ error: err });
                } else if (existingEmailUser) {
                    res.status(400).json({ error: 'El correo electrónico ya está en uso' });
                } else {
                    db.insert(newUser, (err, user) => {
                        if (err) {
                            res.status(500).json({ error: err });
                        } else {
                            res.status(201).json(user);
                        }
                    });
                }
            });
        }
    });
});

router.put('/:id', (req, res) => {
    const userId = req.params.id;
    const updatedUser = req.body;
    db.update({ _id: userId }, { $set: updatedUser }, {}, (err, numReplaced) => {
        if (err) {
            res.status(500).json({ error: err });
        } else if (numReplaced === 0) {
            res.status(404).json({ error: 'Usuario no encontrado' });
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
            res.status(404).json({ error: 'Usuario no encontrado' });
        } else {
            res.sendStatus(204);
        }
    });
});

router.delete('/:id', (req, res) => {
    const userId = req.params.id;
    db.remove({ _id: userId }, {}, (err, numRemoved) => {
        if (err) {
            res.status(500).json({ error: err });
        } else if (numRemoved === 0) {
            res.status(404).json({ error: 'Usuario no encontrado' });
        } else {
            res.sendStatus(204);
        }
    });
});


module.exports = router;