const express = require('express');
const router = express.Router();
const Datastore = require('nedb');
const fetch = require('node-fetch');

const db = new Datastore({ filename: 'data/votes.db', autoload: true });

router.get('/', (req, res) => {
    db.find({}, (err, votes) => {
        if (err) {
            res.status(500).json({ error: err });
        } else {
            res.json(votes);
        }
    });
});

router.get('/user/:userId', (req, res) => {
    const userId = req.params.userId;
    db.find({ targetUserId: userId }, (err, userVotes) => {
        if (err) {
            res.status(500).json({ error: err });
        } else {
            res.json(userVotes);
        }
    });
});

router.get('/voter/:voterId', (req, res) => {
    const voterId = req.params.voterId;
    db.find({ voterId: voterId }, (err, userVotes) => {
        if (err) {
            res.status(500).json({ error: err });
        } else {
            res.json(userVotes);
        }
    });
});

router.post('/', async (req, res) => {
    const configAPI = `${req.endpoint}/api/config/`;
    const userAPI = `${req.endpoint}/api/users/`;
    const newVote = req.body;    

    const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },        
      };

    try {
        // Verificar si el voterId existe
        await fetch(`${userAPI}${newVote.voterId}`, options);
        //await axios.get(`${userAPI}${newVote.voterId}`);
        // Verificar si el targetUserId existe
        await fetch(`${userAPI}${newVote.targetUserId}`, options);
        //await axios.get(`${userAPI}${newVote.targetUserId}`);

        //const response = await axios.get(`${configAPI}votingLimit`);

        const response = await fetch(`${configAPI}votingLimit`, options);
        const responseData = await response.json();

        const votingStatus = await fetch(`${configAPI}votingStatus`, options);
        const votingStatusResponse = await votingStatus.json();        

        const userVotesCount = await countVotesByUser(newVote.voterId);

        console.log("votingLimit", responseData.votingLimit);
        console.log("userVotesCount", userVotesCount);

        if (votingStatusResponse.votingStatus == "closed") {
            throw new Error("votingClosed");
        }

        if (responseData.votingLimit > -1 && userVotesCount >= responseData.votingLimit) {
            throw new Error("limitExceded");
        }

        db.findOne({ voterId: newVote.voterId, targetUserId: newVote.targetUserId }, (err, existingVote) => {
            if (err) {
                res.status(500).json({ error: err });
            } else if (existingVote) {
                res.status(400).json({ error: 'El usuario ya ha votado a este usuario objetivo' });
            } else {
                // Insertar el nuevo voto
                db.insert(newVote, (err, vote) => {
                    if (err) {
                        res.status(500).json({ error: err });
                    } else {
                        res.status(201).json(vote);
                    }
                });
            }
        });
    } catch (error) {
        switch (error.message) {
            case "limitExceded":
                res.status(429).json({ error: "El usuario ya ha alcanzado el número de votos disponible"});
                break;
            case "votingClosed":
                res.status(401).json({ error: "El periodo de votación está cerrado en este momento"});
                break;                        
            default:
                res.status(404).json({ error: 'Uno de los usuarios no existe' });
                break;
        }
    }
});

router.delete('/all', (req, res) => {
    db.remove({}, { multi: true }, (err, numRemoved) => {
        if (err) {
            res.status(500).json({ error: 'Error al eliminar votaciones' });
        } else {
            res.json({ message: `Se eliminaron ${numRemoved} votaciones correctamente` });
        }
    });
});

router.delete('/:id', (req, res) => {
    const voteId = req.params.id;
    db.remove({ _id: voteId }, {}, (err, numRemoved) => {
        if (err) {
            res.status(500).json({ error: err });
        } else if (numRemoved === 0) {
            res.status(404).json({ error: 'Voto no encontrado' });
        } else {
            res.sendStatus(204);
        }
    });
});

function countVotesByUser(userId) {
    return new Promise((resolve, reject) => {
        db.find({ voterId: userId }, (err, votes) => {
            if (err) {
                reject(err);
            } else {
                const count = votes.length;
                resolve(count);
            }
        });
    });
}

router.delete('/comment/:comment', (req, res) => {
    const comment = req.params.comment;

    db.update({ comment: comment }, { $set: { comment: "" }}, { multi: true }, (err, users) => {
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


module.exports = router;