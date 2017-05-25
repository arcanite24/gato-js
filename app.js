/* Gato JS */
const PORT = 8080;

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('assets'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let rooms = {};

io.on('connection', (socket) => {
  console.log(`Socket conectado: ${socket.id}`);

  socket.on('joined', (data) => {
    socket.emit('player-join', {room: rooms[data.room], room_id: data.room, new_player: data.new_player});
  });

  socket.on('disconnect', () => {
    console.log(`Socket desconectado: ${socket.id}`);
    for (let room in rooms) {
      rooms[room].splice(rooms[room].indexOf(socket.id), 1);
    }
  });

});

app.get('/', (req, res) => res.sendfile(__dirname + '/index.html'));

app.post('/join/:id/:socket', (req, res) => {
  let id = req.params.id;
  let socket = req.params.socket;
  if(!id) return res.json({err: 'Ingresa una sala...'});
  if(!socket) return res.json({err: 'Problema con el socket, id no ingresado...'});
  if(!rooms[id]) rooms[id] = [];
  if(rooms[id].length >= 2) return res.json({err: 'Sala llena...'});
  rooms[id].push(socket);
  console.log(rooms[id].length);
  io.sockets.emit('player-join', {room: rooms[id], socket: socket, room_id: id, initial: socket});
  return res.json({room: rooms[id], token: rooms[id].length > 1 ? 0 : 1});
});

app.post('/playToken/:id/:socket/:cell/:token', (req, res) => {
  let id = req.params.id;
  let socket = req.params.socket;
  let cell = req.params.cell;
  let token = req.params.token;
  io.sockets.emit('token-played', {token: token, cell: cell, room: id, player: socket});
  return res.json({msg: 'Token jugado correctamente.'})
});

app.get('/salas', (req, res) => res.json(rooms));

server.listen(PORT, () => {
  console.log('INFO: Server iniciado en ', PORT);
});
