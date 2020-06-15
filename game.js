(function (w, d) {
  // Initial Grid Data
  const initialGridData = getInitialGridData();

  // Strings
  const strings = {
    getInitialGameConsoleString() {
      return `Please wait! Initializing Game...`;
    },
    getInitialCurrentTurnString() {
      return 'Initializing Game...';
    },
    getLeaveConfirmText() {
      return `Are you sure you want to leave the game?`;
    },
    getEnemyGridCaption() {
      return 'Enemy Waters';
    },
    getHomeGridCaption() {
      return 'Home Waters';
    },
  };

  // Game states
  const gameStates = {
    gameIsInitializing: 'gameIsInitializing',
    gameInitialized: 'gameInitialized',
  };

  // Global state variables
  const state = {
    gameState: gameStates.gameIsInitializing,
    playerName: '',
    enemyPlayerGridData: initialGridData,
    PlayerGridData: initialGridData,
  };

  // Prohibit modification of state
  Object.freeze(gameStates);
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
      state.playerName = 'Patrick';
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
          if (e.target.classList.contains('cell')) {
            const elementId = e.target.closest('.grid').id;
            switch (elementId) {
              case 'enemy-grid':
                console.log(
                  `Click on Enemy Grid ${e.target.dataset.y.toUpperCase()}${
                    e.target.dataset.x
                  }`,
                );
                break;

              case 'friendly-grid':
                console.log(
                  `Click on Friendly Grid ${e.target.dataset.y.toUpperCase()}${
                    e.target.dataset.x
                  }`,
                );
                break;

              default:
                break;
            }
          }
        });
      });

      showRulesBtn.addEventListener('click', (e) => {
        console.log('Show Rules Btn Pressed!');
      });

      toggleMusicBtn.addEventListener('click', (e) => {
        console.log('Toggle Music Btn Pressed!');
      });

      toggleSoundBtn.addEventListener('click', (e) => {
        console.log('Toggle Sound Btn Pressed!');
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
        addConsoleMessage(chatMessagesList, chatInput.value, state.playerName);
        chatInput.value = '';
      });

      // Init complete
      state.gameState = gameStates.gameInitialized;
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
      .map((e, i) => `<th>${i}</th>`)
      .join('');
    const tableContent = data
      .map((rowData, indexY) => {
        return `
      <tr>
      <th>${letters[indexY]}</th>
        ${rowData
          .map(
            (cellData, indexX) =>
              `<td class="cell" data-x="${indexX}" data-y="${
                letters[indexY]
              }">${cellData ? cellData : ''}</td>`,
          )
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

  // Initial grid data
  function getInitialGridData() {
    return new Array(10).fill(new Array(10).fill(undefined, 0, 10), 0, 10);
  }

  // Leave Game
  function leaveGame() {
    if (confirm(strings.getLeaveConfirmText())) w.location = '/';
  }

  // Utility Functions
  // ...
})(window, document);
