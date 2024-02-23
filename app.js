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


const app = express();
const port = 3000;

var endpointConfig = "test2";

// Middleware para parsear JSON en las solicitudes
app.use(bodyParser.json());

app.use(express.static("public"));

// Configuración de la base de datos NeDB
// const db = new Datastore({ filename: "users.db", autoload: true });

// Middleware para manejar datos JSON
app.use(cors());
app.use(express.json());

// const initialUsers = [
//   { name: "Usuario 1", email: "usuario1@example.com" },
//   { name: "Usuario 2", email: "usuario2@example.com" },
//   { name: "Usuario 3", email: "usuario3@example.com" },
// ];

// db.find({}, (err, users) => {
//   if (err) {
//     console.error("Error al buscar usuarios:", err);
//   } else if (users.length === 0) {
//     db.insert(initialUsers, (err, newUsers) => {
//       if (err) {
//         console.error("Error al insertar usuarios iniciales:", err);
//       } else {
//         console.log("Usuarios iniciales insertados correctamente:", newUsers);
//       }
//     });
//   } else {
//     console.log("Se encontraron usuarios existentes:", users);
//   }
// });

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
console.log("HOLA QUE TAL!");
const endpoint = "https://sprint-masai.onrender.com";
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

// app.listen(port, () => {
//   console.log(`Servidor Masáis corriendo en ${port}`);
// });


app.listen(process.env.PORT, () => {
    console.log(`Servidor Masáis corriendo en ${endpoint}`);
});