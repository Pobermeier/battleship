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
    const availGames = games.filter((game) => !game.isGameFull());
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

  if (!playerName || !gameId || !playerId) {
    res.status(404).redirect('/');
  } else {
    const updatedGames = games.map((game) => {
      if (game.id === gameId) {
        if (game.isGameFull()) {
          res.status(404).redirect('/');
          return game;
        } else if (game.isGameEmpty()) {
          res.status(404).redirect('/');
          return null;
        } else {
          game.players.push(player);
          return game;
        }
      } else {
        return game;
      }
    });
    games = [...updatedGames];
  }

  res.redirect(
    `/play.html?playerName=${playerName}&game=${gameId}&playerId=${playerId}`,
  );
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
    const game = new Game(generateUUID(), `${playerName}'s Game`, [player]);

    console.log('Created new game', JSON.stringify(game));
    games.push(game);

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

const io = socketio(server);
