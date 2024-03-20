// backend/server.js

const express = require("express");
const Datastore = require("nedb");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
var os = require("os");

const userRoutes = require("./userRoutes");
const voteRoutes = require("./voteRoutes");
const configRoutes = require("./configRoutes");
const teamsRoutes = require("./teamsRoutes");


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
console.log("HOLA QUE TAL!");
//const endpoint = "https://sprint-masai.onrender.com";
//endpointConfig = { endpoint };

//fs.writeFileSync("./endpoint.config", JSON.stringify(endpointConfig));

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

app.get("/endpoint.config", (req, res) => {
  // Leer el archivo de configuración y enviarlo como respuesta
  fs.readFile("endpoint.config", "utf8", (err, data) => {
    if (err) {
      console.error("Error al leer el archivo de configuración:", err);
      return res.status(500).send("Error interno del servidor");
    }
    res.json(JSON.parse(data));
  });
});

app.listen(port, () => {
  console.log(`Servidor Masáis corriendo en ${port}`);
});


// app.listen(process.env.PORT, () => {
//     console.log(`Servidor Masáis corriendo en ${endpoint}`);
// });