(function (w, d) {
  // Get data from query string
  const { playerName, game, playerId } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
  });

  const redirectToHomePage = () => {
    w.location = '/';
  };

  // If any of the query-string params was not set => redirect to home-screen
  (!playerName || !game || !playerId) && redirectToHomePage();

  // Init socket.io
  const socket = io();
  // Disconnect socket when browser window is closed
  w.onclose = socket.disconnect;

  // Initial Grid Data
  const initialGridData = getInitialGridData();

  // Strings
  const strings = {
    getInitialGameConsoleString: () => `Please wait! Initializing Game...`,
    getInitialCurrentTurnString: () => 'Initializing Game...',
    getLeaveConfirmText: () => `Are you sure you want to leave the game?`,
    getEnemyGridCaption: () => 'Enemy Waters',
    getHomeGridCaption: () => 'Home Waters',
    getGameHasNotStartedErrorMessage: () =>
      "You cannot attack yet, because the game hasn't started. Please place all of your ships for the game to begin!",
    getWrongFieldClickedErrorMessage: () =>
      "There's no point in clicking here! Click on your enemies' play field to attack his ships.",
    getGameIsAlreadyOverErrorMessage: () =>
      'Game is over! You can stop clicking!',
  };

  // Game states
  const gameStates = {
    gameIsInitializing: 'gameIsInitializing',
    gameInitialized: 'gameInitialized',
    setShipsRound: 'setShipsRound',
    gameRunning: 'gameRunning',
    gameOver: 'gameOver',
  };

  // Global state variables
  const state = {
    gameId: game,
    gameState: gameStates.gameIsInitializing,
    playerName: playerName,
    playerId: playerId,
    enemyPlayerGridData: initialGridData,
    PlayerGridData: initialGridData,
    currentRound: 0,
    yourTurn: false,
  };

  // Prohibit modification of state
  Object.freeze(gameStates);
  Object.freeze(state);
  Object.seal(gameStates);
  Object.seal(state);

  // Init game once DOM elements are fully loaded
  d.addEventListener('DOMContentLoaded', () => {
    // UI References
    const headerLogoLink = d.querySelector('.header .logo a');
    const currentRoundText = d.querySelector('#current-round-txt');
    const currentTurnText = d.querySelector('#current-turn-txt');
    const playerGrids = d.querySelectorAll('.grid');
    const enemyGrid = d.querySelector('#enemy-grid');
    const friendlyGrid = d.querySelector('#friendly-grid');
    const chatForm = d.querySelector('#console form');
    const chatMessagesList = d.querySelector('#chat-messages-list');
    const chatInput = d.querySelector('#chat-message-input');
    const showRulesBtn = d.querySelector('#show-rules-btn');
    const toggleMusicBtn = d.querySelector('#toogle-music-btn');
    const toggleSoundBtn = d.querySelector('#toogle-sound-btn');
    const toggleFullScreenBtn = d.querySelector('#toggle-fullscreen-btn');
    const leaveGameBtn = d.querySelector('#leave-game-btn');

    // Init Game functions
    (function init() {
      // Join Game
      socket.emit('joinGame', {
        gameId: state.gameId,
        playerId: state.playerId,
        playerName: state.playerName,
      });

      // On receiving message
      socket.on('message', (message) =>
        addConsoleMessage(chatMessagesList, message),
      );

      // On receiving chatMessage
      socket.on('chatMessage', ({ playerName, message }) => {
        console.log(playerName, message);
        addConsoleMessage(chatMessagesList, message, playerName);
      });

      socket.on('nextRound', () => {
        state.currentRound++;
        currentRoundText.innerHTML = state.currentRound;
      });

      socket.on('yourTurn', (value) => {
        state.yourTurn = value;
        if (state.yourTurn) {
          currentTurnText.innerHTML = `It's your turn!`;
        } else {
          currentTurnText.innerHTML = `Other player's turn...`;
        }
      });

      socket.on('updateGrid', ({ gridToUpdate, data }) => {
        switch (gridToUpdate) {
          case 'enemyGrid':
            updateGrid(enemyGrid, 'Enemy Waters', data);
            break;

          case 'friendlyGrid':
            updateGrid(friendlyGrid, 'Home Waters', data);
            break;
        }
      });

      // On receiving gameStateChange
      socket.on('changeGameState', (newGameState) => {
        switch (newGameState) {
          case gameStates.gameInitialized:
            state.gameState = gameStates.gameInitialized;
            currentTurnText.innerHTML = 'Initialized';
            console.log(state.gameState);
            break;

          case gameStates.setShipsRound:
            state.gameState = gameStates.setShipsRound;
            currentTurnText.innerHTML = 'Place your ships!';
            console.log(state.gameState);
            break;

          case gameStates.gameRunning: {
            state.gameState = gameStates.gameRunning;
            currentTurnText.innerHTML = 'Let the fighting begin!';
            console.log(state.gameState);
            break;
          }

          case gameStates.gameOver:
            state.gameState = gameStates.gameOver;
            currentTurnText.innerHTML = 'Game Over!';
            setTimeout(() => redirectToHomePage(), 10000);
            console.log(state.gameState);
            break;
        }
      });

      // Clean up URL => remove query string
      w.history.replaceState({}, d.title, '/' + 'play.html');

      addConsoleMessage(
        chatMessagesList,
        strings.getInitialGameConsoleString(),
      );
      chatInput.focus();
      currentRoundText.innerHTML = '0';
      currentTurnText.innerHTML = strings.getInitialCurrentTurnString();

      // Initialize Player Grids
      initializePlayerGrids(
        [enemyGrid, friendlyGrid],
        [strings.getEnemyGridCaption(), strings.getHomeGridCaption()],
        initialGridData,
      );

      // Register UI Event Listeners
      headerLogoLink.addEventListener('click', (e) => {
        e.preventDefault();
        leaveGame();
      });

      playerGrids.forEach((grid) => {
        grid.addEventListener('click', (e) => {
          const elementId = e.target.closest('.grid').id;

          if (state.gameState === gameStates.gameOver) {
            addConsoleMessage(
              chatMessagesList,
              strings.getGameIsAlreadyOverErrorMessage(),
            );
          } else if (
            state.gameState === gameStates.gameRunning &&
            state.yourTurn &&
            e.target.classList.contains('cell')
          ) {
            switch (elementId) {
              case 'enemy-grid':
                socket.emit('clickOnEnemyGrid', {
                  x: e.target.dataset.x,
                  y: e.target.dataset.y,
                });
                console.log(
                  `Click on Enemy Grid ${e.target.dataset.y.toUpperCase()}${
                    e.target.dataset.x
                  }`,
                );
                break;

              case 'friendly-grid':
                addConsoleMessage(
                  chatMessagesList,
                  strings.getWrongFieldClickedErrorMessage(),
                );
                break;
            }
          } else if (
            state.gameState === gameStates.setShipsRound &&
            e.target.classList.contains('cell')
          ) {
            switch (elementId) {
              case 'enemy-grid':
                addConsoleMessage(
                  chatMessagesList,
                  strings.getGameHasNotStartedErrorMessage(),
                );
                break;

              case 'friendly-grid':
                socket.emit('clickOnFriendlyGrid', {
                  x: e.target.dataset.x,
                  y: e.target.dataset.y,
                });

                console.log(
                  `Click on Friendly Grid ${e.target.dataset.y.toUpperCase()}${
                    e.target.dataset.x
                  }`,
                );
                break;
            }
          }
        });
      });

      showRulesBtn.addEventListener('click', (e) => {
        console.log('Show Rules Btn Pressed!');
        alert('Coming Soon!');
      });

      toggleMusicBtn.addEventListener('click', (e) => {
        console.log('Toggle Music Btn Pressed!');
        alert('Coming Soon!');
      });

      toggleSoundBtn.addEventListener('click', (e) => {
        console.log('Toggle Sound Btn Pressed!');
        alert('Coming Soon!');
      });

      toggleFullScreenBtn.addEventListener('click', (e) => {
        toggleFullScreen(d.body);
      });

      leaveGameBtn.addEventListener('click', (e) => {
        leaveGame();
      });

      d.addEventListener('keydown', (e) => {
        if (e.keyCode === 13) chatInput.focus();
      });

      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        socket.emit('chatMessage', {
          playerName: state.playerName,
          message: chatInput.value,
        });
        chatInput.value = '';
        chatInput.focus();
      });
    })();
  });

  // Init Player Grids
  function initializePlayerGrids(playerGridRoots, captions, data) {
    playerGridRoots.forEach((root, index) => {
      updateGrid(root, captions[index], data);
    });
  }

  // Add console message
  function addConsoleMessage(
    consoleElement,
    messageTxt,
    senderName = '[System]',
  ) {
    consoleElement.innerHTML += `<li><strong>${senderName}</strong>: ${messageTxt}</li>`;
    consoleElement.scrollTop = consoleElement.scrollHeight;
  }

  // Toggle Fullscreen
  function toggleFullScreen(elem) {
    if (
      (d.fullScreenElement !== undefined && d.fullScreenElement === null) ||
      (d.msFullscreenElement !== undefined && d.msFullscreenElement === null) ||
      (d.mozFullScreen !== undefined && !d.mozFullScreen) ||
      (d.webkitIsFullScreen !== undefined && !d.webkitIsFullScreen)
    ) {
      if (elem.requestFullScreen) {
        elem.requestFullScreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullScreen) {
        elem.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      if (d.cancelFullScreen) {
        d.cancelFullScreen();
      } else if (d.mozCancelFullScreen) {
        d.mozCancelFullScreen();
      } else if (d.webkitCancelFullScreen) {
        d.webkitCancelFullScreen();
      } else if (d.msExitFullscreen) {
        d.msExitFullscreen();
      }
    }
  }

  // Update grid
  function updateGrid(rootElement, captionText, data) {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const tableHeaderCells = new Array(10)
      .fill('', 0, 10)
      .map((_, i) => `<th>${i}</th>`)
      .join('');
    const tableContent = data
      .map((rowData, indexY) => {
        return `
      <tr>
      <th>${letters[indexY]}</th>
        ${rowData
          .map((cellData, indexX) => {
            switch (cellData) {
              case 3:
                return `<td class="cell ship-hit" data-x="${indexX}" data-y="${letters[indexY]}"></td>`;
              case 2:
                return `<td class="cell water-hit" data-x="${indexX}" data-y="${letters[indexY]}"></td>`;
              case 1:
                return `<td class="cell ship" data-x="${indexX}" data-y="${letters[indexY]}"></td>`;
              case 0:
              default:
                return `<td class="cell" data-x="${indexX}" data-y="${letters[indexY]}"></td>`;
            }
          })
          .join('')}
      </tr>
      `;
      })
      .join('');

    rootElement.innerHTML = `
      <table>
        <caption>
          <h5><strong>${captionText}</strong></h5>
        </caption>
        <thead>
          <th></th>
          ${tableHeaderCells}
        </thead>
        <tbody>
          ${tableContent}
        </tbody>
      </table>
    `;
  }

  // Utility Functions

  // Initial grid data
  function getInitialGridData(width = 10, height = 10, initialCellValue = 0) {
    const gridArray = [];

    for (let i = 0; i < height; i++) {
      gridArray.push(new Array(width).fill(initialCellValue));
    }

    return gridArray;
  }

  // Leave Game
  function leaveGame() {
    confirm(strings.getLeaveConfirmText()) && redirectToHomePage();
    socket.disconnect();
  }
})(window, document);
