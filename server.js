const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const socketio = require('socket.io');
const generateUUID = require('./helpers/generateUUID');
const Game = require('./models/Game');
const Player = require('./models/Player');

// Games data - managed in-memory while server is running
let games = require('./data/games');
// Get port from Heroku env-vars in production
const PORT = process.env.PORT || 5007;
// Init Express
const app = express();

// Init Express-Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configure API-Routes

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
    console.log('All games currently live: ', JSON.stringify(games));
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
    console.log('Created new game: ', JSON.stringify(game));

    games = { ...games, [gameId]: game };
    console.log('All games currently live: ', JSON.stringify(games));

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

// Game helper functions
const getInitialGridData = require('./helpers/getInitialGridData');

// Game states for simple state machine
const gameStates = {
  gameIsInitializing: 'gameIsInitializing',
  gameInitialized: 'gameInitialized',
  setShipsRound: 'setShipsRound',
  gameRunning: 'gameRunning',
  gameOver: 'gameOver',
};

// Socket.io Stuff
const io = socketio(server);

io.on('connection', (socket) => {
  // The state for this individual session = player
  const state = {
    gameState: gameStates.gameIsInitializing,
    gameId: null,
    playerId: null,
    playerName: '',
  };

  socket.on('joinGame', ({ gameId, playerId, playerName }) => {
    // Set state variables for this connection
    state.gameId = gameId;
    state.playerName = playerName;
    state.playerId = playerId;

    // Join game / room
    socket.join(gameId);

    // Initialize grid data for this player
    games[state.gameId][`${playerId}_grid`] = getInitialGridData();
    games[state.gameId][`${playerId}_shipsPlaced`] = 0;

    // Change game state to "initialized"
    state.gameState = gameStates.gameInitialized;
    socket.emit('changeGameState', state.gameState);
    socket.emit('message', 'Welcome to the game!');

    // Broadcast to other player that another player has joined
    socket.broadcast
      .to(gameId)
      .emit('message', `${playerName} has joined the game.`);

    // Check number of players, as soon as both players are there => game can start
    if (games[state.gameId].players.length <= 1) {
      socket.emit('message', 'Waiting for other players to join...');
    } else if (games[state.gameId].players.length >= 2) {
      state.gameState = gameStates.setShipsRound;
      io.to(state.gameId).emit('changeGameState', state.gameState);
      io.to(state.gameId).emit(
        'message',
        'The game has started! Place your ships!',
      );
    }
  });

  // Handle chat messages between players
  socket.on('chatMessage', ({ playerName, message }) => {
    io.to(state.gameId).emit('chatMessage', {
      playerName,
      message,
    });
  });

  // Send messages when a player leaves the game
  socket.on('disconnect', () => {
    io.to(state.gameId).emit(
      'message',
      `${state.playerName} has left the game.`,
    );

    // Cleanup when one or both players leave => delete game from memory when both left
    if (games[state.gameId])
      games[state.gameId].players = games[state.gameId].players.filter(
        (player) => player.id !== state.playerId,
      );

    // Change game-state to gameover - inform player about his win
    state.gameState = gameStates.gameOver;
    io.to(state.gameId).emit('changeGameState', state.gameState);
    io.to(state.gameId).emit(
      'message',
      'Congrats! You won as the other player has left the game! You will be automatically loaded to the main menu in 10 seconds...',
    );

    if (
      games[state.gameId] &&
      games[state.gameId].players &&
      games[state.gameId].players.length === 0
    ) {
      delete games[state.gameId];
    }

    socket.disconnect();
  });
});
