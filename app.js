// backend/server.js
const express = require("express");
const Datastore = require("nedb");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
var os = require("os");

const cron = require('node-cron');
const axios = require('axios');

const userRoutes = require("./routes/userRoutes");
const voteRoutes = require("./routes/voteRoutes");
const configRoutes = require("./routes/configRoutes");
const teamsRoutes = require("./routes/teamsRoutes");
const commentsRoutes = require("./routes/commentsRoutes");

const { log, error } = require('./logconsole');

const app = express();
const port = process.env.PORT || 3000;

var endpointConfig = "test2";

app.use(bodyParser.json());

app.use(express.static("public"));

app.use(cors());
app.use(express.json());




let ipAddress = "";
const interfaces = os.networkInterfaces();

Object.keys(interfaces).forEach((key) => {
  interfaces[key].forEach((iface) => {
    if (iface.family === "IPv4" && !iface.internal) {
      ipAddress = iface.address;
    }
  });
});

//const endpoint = `http://${ipAddress}:${port}`; // URL del endpoint
const endpoint = `http://localhost:${port}`; // URL del endpoint
log("HOLA QUE TAL!");
//const endpoint = "https://sprint-masai.onrender.com";
endpointConfig = { endpoint };

fs.writeFileSync("endpoint.config", JSON.stringify(endpointConfig));

// Usa las rutas de la API de votos
app.use("/api/users", userRoutes);

// Usa las rutas de la API de votos
app.use(
  "/api/votes",
  (req, res, next) => {
    req.endpoint = endpoint;
    next();
  },
  voteRoutes
);

app.use(
    "/api/config",
    (req, res, next) => {
      req.endpoint = endpoint;
      next();
    },
    configRoutes
  );

app.use(
    "/api/teams",
    (req, res, next) => {
      req.endpoint = endpoint;
      next();
    },
    teamsRoutes
  );  

app.use(
    "/api/comments",
    (req, res, next) => {
      req.endpoint = endpoint;
      next();
    },
    commentsRoutes
  );  

app.get("/endpoint.config", (req, res) => {
  // Leer el archivo de configuración y enviarlo como respuesta
  fs.readFile("endpoint.config", "utf8", (err, data) => {
    if (err) {
      error("Error al leer el archivo de configuración:", err);
      return res.status(500).send("Error interno del servidor");
    }
    res.json(JSON.parse(data));
  });
});

app.listen(port, () => {
  log(`Servidor Masáis corriendo en ${port}`);
});

async function getUsersData() {
  try {
      const response = await axios.get(`${endpoint}/api/users`);
      return response.data;
  } catch (error) {
      error('Error getting users data:', error);
      return [];
  }
}

function isBirthdayToday(birthday) {
  const today = new Date();
  const dia = String(today.getDate()).padStart(2, '0');
  const mes = String(today.getMonth() + 1).padStart(2, '0');
  const todayBirthday = `${dia}/${mes}`;
  return birthday === todayBirthday;
}

async function sendTeamsMessage(user) {
  try {
      const message = {
        "type": "message",
        "attachments": [
            {
                "contentType": "application/vnd.microsoft.card.adaptive",
                "content": {
                    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                    "type": "AdaptiveCard",
                    "version": "1.4",
                    "body": [
                        {
                            "type": "TextBlock",
                            "id": "MentionTextBlock",
                            "text": "¡Tenemos cumpleañero!",
                            "weight": "Bolder",
                            "size": "Large"
                        },
                        {
                            "type": "TextBlock",
                            "text": `Felicitemos hoy a **${user.name}**`,
                            "size": "Medium"
                        },
                        {
                            "type": "TextBlock",
                            "text": "Que pases un magnífico día hoy",
                            "size": "Medium"
                        }
                    ]
                }
            }
        ]
    };

      log('Enviando mensaje a Teams:', JSON.stringify(message));
      await axios.post('https://blevraultgroup.webhook.office.com/webhookb2/33eeba4c-e031-4e60-9ccf-e083d7523cd3@8c9f5440-d6bf-4e89-a448-9e3e3a224ba3/IncomingWebhook/0b5678f32339467db41e8f25a9b5287d/be94e17c-24d5-409b-b7b2-18323c584f80', message);
      log('Mensaje enviado a Teams:');
  } catch (error) {
      error('Error al enviar el mensaje a Teams:', error);
  }
}

async function birthdayCheck() {
  const users = await getUsersData();

  log("Got users", users);

  users.forEach(user => {
      if (isBirthdayToday(user.birthday)) {
          sendTeamsMessage(user);
      }
  });
}

cron.schedule('00 07 00 * * *', async () => {
  log('Executing birthday cron task...');
  
  await birthdayCheck();
}, {
  scheduled: true,
  timezone: "Europe/Madrid"
});

birthdayCheck();

// app.listen(process.env.PORT, () => {
//     console.log(`Servidor Masáis corriendo en ${endpoint}`);
// });

//CAMBIOS SONOMASAI-001