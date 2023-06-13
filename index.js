//import express from 'express';
/*import {createServer} from 'http';
import app from './app.js';

const server = createServer(app);
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});*/

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(require('./routes/index.js'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at: http://localhost:${port}`);
});

app.get('/', (req, res) => {
  res.send('Welcome to libros API-REST!!');
});

const { db } = require('./cnn');


