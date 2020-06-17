const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const generateUUID = require('./helpers/generateUUID');
const Game = require('./models/Game');
const Player = require('./models/Player');
const games = require('./data/games');

const PORT = process.env.PORT || 5007;

// Init Express
const app = express();

// Init Express-Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const player = new Player(generateUUID(), 'Patrick');
const player2 = new Player(generateUUID(), 'Patrick2');
const game = new Game(generateUUID(), `${player.playerName}'s Game`, [player]);
const game2 = new Game(generateUUID(), `${player.playerName}'s Game`, [player]);

games.push(game);
games.push(game2);

console.log(JSON.stringify(games));

// Configure Routes
app.get('/games', (req, res) => {
  if (!games) {
    res.status(500).json({ statusCode: 500, msg: 'Internal Server Error' });
  } else {
    // Filter out full games
    const availGames = games.filter((game) => !game.isGameFull());
    res.status(200).json(availGames);
  }
});

app.post('/games', (req, res) => {});

// Set Express Static-Folder
app.use(express.static(path.resolve(__dirname, 'wwwroot')));

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
