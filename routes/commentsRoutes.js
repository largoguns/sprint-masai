const express = require('express');
const router = express.Router();
const Datastore = require('nedb');
const { log, error } = require('../logconsole'); // Importa las funciones

const db = new Datastore({ filename: 'data/comment.db', autoload: true });

router.get('/', (req, res) => {
    db.find({}).sort({ comment:1 }).exec((err, teams) => {
        if (err) {
            res.status(500).json({ error: err });
        } else {
            res.json(teams);
        }
    });
});

router.get('/:name', (req, res) => {
    const comment = req.params.comment;

    db.find({ comment: new RegExp(comment, 'i') }, (err, users) => {
        if (err) {
            res.status(500).json({ error: err });
        } else {
            if (users.length === 0) {
                res.status(404).json({ error: 'Comentario no encontrado' });
            } else {
                res.json(users);
            }
        }
    });
});

router.post('/', (req, res) => {
    const newComment = req.body;
    
    db.findOne({ comment: newComment.comment }, (err, existingTeam) => {
        if (err) {
            res.status(500).json({ error: err });
        } else if (existingTeam) {
            res.status(400).json({ error: 'El comentario ya existe' });
        } else {
            db.insert(newComment, (err, team) => {
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
    const commentID = req.params.id;
    const updatedComment = req.body;
    db.update({ _id: commentID }, { $set: updatedComment }, {}, (err, numReplaced) => {
        if (err) {
            res.status(500).json({ error: err });
        } else if (numReplaced === 0) {
            res.status(404).json({ error: 'Comentario no encontrado' });
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
            res.status(404).json({ error: 'Comentario no encontrado' });
        } else {
            res.sendStatus(204);
        }
    });
});

router.delete('/:id', (req, res) => {
    const commentID = req.params.id;
    db.remove({ _id: commentID }, {}, (err, numRemoved) => {
        if (err) {
            res.status(500).json({ error: err });
        } else if (numRemoved === 0) {
            res.status(404).json({ error: 'Comentario no encontrado' });
        } else {
            res.sendStatus(204);
        }
    });
});

module.exports = router;