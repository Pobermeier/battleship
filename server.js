const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const socketio = require('socket.io');
const generateUUID = require('./helpers/generateUUID');
const Game = require('./models/Game');
const Player = require('./models/Player');

// Games data - managed in-memory while server is running
let games = require('./data/games');

const PORT = process.env.PORT || 5007;

// Init Express
const app = express();

// Init Express-Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configure Routes

// Route gets called when list of available games is requested by client
app.get('/games', (req, res) => {
  if (!games) {
    res.status(500).json({ statusCode: 500, msg: 'Internal Server Error' });
  } else {
    // Filter out full games
    const availGames = Object.values(games).filter(
      (game) => !game.isGameFull(),
    );
    console.log('Available games requested:', JSON.stringify(availGames));
    res.status(200).json(availGames);
  }
});

// Route gets called when a player joins an existing game
app.get('/games/join', (req, res) => {
  const playerName = req.query['playerName'];
  const playerId = req.query['playerId'];
  const gameId = req.query.game;

  const player = new Player(playerId, playerName);

  console.log(gameId);
  console.log(games);
  console.log(games[gameId]);

  if (!playerName || !gameId || !playerId) {
    res.status(404).redirect('/');
  } else if (games[gameId].isGameFull()) {
    res.status(404).redirect('/');
  } else if (games[gameId].isGameEmpty()) {
    delete games[gameId];
    res.status(404).redirect('/');
  } else {
    games[gameId].players.push(player);
    res.redirect(
      `/play.html?playerName=${playerName}&game=${gameId}&playerId=${playerId}`,
    );
  }
});

// Route gets called when a new game is being created
app.post('/games', (req, res) => {
  if (!games) {
    res.status(500).json({ statusCode: 500, msg: 'Internal Server Error' });
  } else if (!req.body['playerName'] || !req.body['playerId']) {
    res.status(500).json({
      statusCode: 404,
      msg: 'Bad request! Please submit correct data!',
    });
  } else {
    const playerName = req.body['playerName'];
    const playerId = req.body['playerId'];
    const player = new Player(playerId, playerName);

    const gameId = generateUUID();
    const game = new Game(gameId, `${playerName}'s Game`, [player]);
    console.log('Created new game', game);

    games = { ...games, [gameId]: game };
    console.log('all games: ', JSON.stringify(games));

    res
      .status(301)
      .redirect(
        `/play.html?playerName=${playerName}&game=${game.id}&playerId=${playerId}`,
      );
  }
});

// Set Express Static-Folder
app.use(express.static(path.resolve(__dirname, 'wwwroot')));

const server = app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});

// Socket.io Stuff
const io = socketio(server);

io.on('connection', (socket) => {
  const state = {
    gameId: null,
    playerId: null,
    playerName: '',
  };

  socket.on('joinGame', ({ gameId, playerId, playerName }) => {
    state.gameId = gameId;
    state.playerName = playerName;
    state.playerId = playerId;

    socket.join(gameId);

    socket.emit('message', 'Welcome to the game!');

    socket.broadcast
      .to(gameId)
      .emit('message', `${playerName} has joined the game.`);
  });

  socket.on('chatMessage', ({ playerName, message }) => {
    io.to(state.gameId).emit('chatMessage', {
      playerName,
      message,
    });
  });

  socket.on('disconnect', () => {
    io.to(state.gameId).emit(
      'message',
      `${state.playerName} has left the game.`,
    );

    games[state.gameId].players = games[state.gameId].players.filter(
      (player) => player.id !== state.playerId,
    );
    if (games[state.gameId].players.length === 0) {
      delete games[state.gameId];
    }
  });
});
