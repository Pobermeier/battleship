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
      (game) => !game.isGameFull() && game.isListed,
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

// Letter for array-number lookup
const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

// Socket.io Stuff
const io = socketio(server);

io.on('connection', (socket) => {
  // The state for this individual session = player
  const state = {
    gameId: null,
    playerId: null,
    playerName: '',
    otherPlayerGrid: getInitialGridData(),
  };

  let thisGame;

  socket.on('joinGame', ({ gameId, playerId, playerName }) => {
    // Set state variables for this connection
    state.gameId = gameId;
    state.playerName = playerName;
    state.playerId = playerId;

    // Join game / room
    socket.join(state.gameId);

    thisGame = games[state.gameId];

    // Initialize grid data for this player
    thisGame[`${state.playerId}_grid`] = getInitialGridData();
    thisGame[`${state.playerId}_shipsPlaced`] = 0;
    thisGame[`${state.playerId}_shipsLost`] = 0;

    // Change game state to "initialized"

    thisGame.gameState = gameStates.gameInitialized;
    socket.emit('changeGameState', thisGame.gameState);
    socket.emit('message', 'Welcome to the game!');

    // Broadcast to other player that another player has joined
    socket.broadcast
      .to(state.gameId)
      .emit('message', `${state.playerName} has joined the game.`);

    // Check number of players, as soon as both players are there => game can start
    if (thisGame.players.length <= 1) {
      socket.emit('message', 'Waiting for other players to join...');
    } else if (thisGame.players.length >= 2) {
      // Unlist game from lobby as soon as a second player joins
      thisGame.isListed = false;

      thisGame.gameState = gameStates.setShipsRound;
      io.to(state.gameId).emit('changeGameState', thisGame.gameState);
      io.to(state.gameId).emit(
        'message',
        'The game has started! Place your ships!',
      );
    }
  });

  socket.on('clickOnEnemyGrid', ({ x, y }) => {
    if (thisGame.gameState === gameStates.gameRunning) {
      y = letters.indexOf(y);

      const otherPlayerId = thisGame.players.filter((player) => {
        return player.id !== state.playerId;
      })[0].id;
      const currentCellValue = thisGame[`${otherPlayerId}_grid`][y][x];

      if (currentCellValue === 2 || currentCellValue === 3) {
        socket.emit(
          'message',
          `You already hit that spot! Click on another one`,
        );
        return;
      }

      if (currentCellValue === 0) {
        thisGame[`${otherPlayerId}_grid`][y][x] = 2;
        state.otherPlayerGrid[y][x] = 2;
        socket.emit('message', `You hit water!`);
        socket.broadcast
          .to(state.gameId)
          .emit('message', `The other player hit nothing!`);
      } else if (currentCellValue === 1) {
        thisGame[`${otherPlayerId}_grid`][y][x] = 3;
        state.otherPlayerGrid[y][x] = 3;
        thisGame[`${otherPlayerId}_shipsLost`]++;
        socket.emit(
          'message',
          `You hit one of the other players' battleships! Nice!`,
        );
        socket.broadcast
          .to(state.gameId)
          .emit(
            'message',
            `Oh noes! The other player hit one of your battleships!`,
          );

        if (thisGame[`${otherPlayerId}_shipsLost`] >= 10) {
          socket.emit('updateGrid', {
            gridToUpdate: 'enemyGrid',
            data: state.otherPlayerGrid,
          });
          socket.broadcast.to(state.gameId).emit('updateGrid', {
            gridToUpdate: 'friendlyGrid',
            data: thisGame[`${otherPlayerId}_grid`],
          });

          thisGame.gameState = gameStates.gameOver;
          io.to(state.gameId).emit('changeGameState', thisGame.gameState);
          io.to(state.gameId).emit(
            'message',
            `${state.playerName} won! Congratulations! You will be automatically loaded to the main menu in 10 seconds...`,
          );
          return;
        }
      }
      socket.emit('updateGrid', {
        gridToUpdate: 'enemyGrid',
        data: state.otherPlayerGrid,
      });
      socket.broadcast.to(state.gameId).emit('updateGrid', {
        gridToUpdate: 'friendlyGrid',
        data: thisGame[`${otherPlayerId}_grid`],
      });

      io.to(state.gameId).emit('nextRound');
      socket.emit('yourTurn', false);
      socket.broadcast.to(state.gameId).emit('yourTurn', true);
    }
  });

  socket.on('clickOnFriendlyGrid', ({ x, y }) => {
    if (thisGame.gameState === gameStates.setShipsRound) {
      y = letters.indexOf(y);
      const currentCellValue = thisGame[`${state.playerId}_grid`][y][x];

      if (
        currentCellValue === 0 &&
        thisGame[`${state.playerId}_shipsPlaced`] < 10
      ) {
        thisGame[`${state.playerId}_grid`][y][x] = 1;
        thisGame[`${state.playerId}_shipsPlaced`]++;
        socket.emit(
          'message',
          `Battleship placed! ${
            10 - thisGame[`${state.playerId}_shipsPlaced`]
          } to go.`,
        );
        socket.emit('updateGrid', {
          gridToUpdate: 'friendlyGrid',
          data: thisGame[`${state.playerId}_grid`],
        });
        if (
          thisGame[`${thisGame.players[0].id}_shipsPlaced`] === 10 &&
          thisGame[`${thisGame.players[1].id}_shipsPlaced`] === 10
        ) {
          thisGame.gameState = gameStates.gameRunning;
          io.to(state.gameId).emit('changeGameState', thisGame.gameState);
          io.to(state.gameId).emit(
            'message',
            'All ships are placed! Let the fighting begin!',
          );
          io.to(state.gameId).emit('nextRound');

          // The player who first places all of his ships gets the first turn
          socket.emit('yourTurn', false);
          socket.broadcast.to(state.gameId).emit('yourTurn', true);
        }
      } else if (
        currentCellValue === 1 &&
        thisGame[`${state.playerId}_shipsPlaced`] < 10
      ) {
        socket.emit(
          'message',
          `You're not allowed to place ships on top of each other! Place your ship in another cell...`,
        );
      } else if (thisGame[`${state.playerId}_shipsPlaced`] >= 10) {
        socket.emit(
          'message',
          `You've already placed the maximum number of ships available`,
        );
      }
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
    if (thisGame)
      thisGame.players = thisGame.players.filter(
        (player) => player.id !== state.playerId,
      );

    // Change game-state to gameover - inform player about his win
    if (thisGame) {
      thisGame.gameState = gameStates.gameOver;
      io.to(state.gameId).emit('changeGameState', thisGame.gameState);

      io.to(state.gameId).emit(
        'message',
        'Congrats! You won as the other player has left the game! You will be automatically loaded to the main menu in 10 seconds...',
      );
    }

    if (thisGame && thisGame.players && thisGame.players.length === 0) {
      thisGame = null;
      delete games[state.gameId];
    }

    socket.disconnect();
  });
});
