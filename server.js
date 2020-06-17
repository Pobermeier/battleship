const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const generateUUID = require('./helpers/generateUUID');
const Game = require('./models/Game');
const Player = require('./models/Player');
let games = require('./data/games');

const PORT = process.env.PORT || 5007;

// Init Express
const app = express();

// Init Express-Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configure Routes
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

app.get('/games/join', (req, res) => {
  const playerName = req.query['player-name'];
  const playerId = req.query['player-id'];
  const gameId = req.query.game;

  const player = new Player(playerId, playerName);

  if (!playerName || !gameId || !playerId) {
    res.status(404).redirect('/');
  } else {
    const updatedGames = games.map((game) => {
      if (game.id === gameId) {
        if (game.isGameFull()) {
          res.status(404).redirect('/');
        } else {
          game.players.push(player);
        }
      }
      return game;
    });
    games = [...updatedGames];
  }

  res.redirect(
    `/play.html?player-name=${playerName}&game=${gameId}&player-id=${playerId}`,
  );
});

app.post('/games', (req, res) => {
  if (!games) {
    res.status(500).json({ statusCode: 500, msg: 'Internal Server Error' });
  } else if (!req.body['player-name'] || !req.body['player-id']) {
    res.status(500).json({
      statusCode: 404,
      msg: 'Bad request! Please submit correct data!',
    });
  } else {
    const playerName = req.body['player-name'];
    const playerId = req.body['player-id'];

    const player = new Player(playerId, playerName);
    const game = new Game(generateUUID(), `${playerName}'s Game`, [player]);

    console.log('Created new game', JSON.stringify(game));
    games.push(game);

    res
      .status(301)
      .redirect(
        `/play.html?player-name=${playerName}&game=${game.id}&player-id=${playerId}`,
      );
  }
});

// Set Express Static-Folder
app.use(express.static(path.resolve(__dirname, 'wwwroot')));

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
