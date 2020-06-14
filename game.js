(function (global, d) {
  // State variables
  const state = {
    isGameInitialized: false,
    playerName: '',
  };

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
  };

  d.addEventListener('DOMContentLoaded', () => {
    // UI References
    const currentRountText = d.querySelector('#current-round-txt');
    const currentTurnText = d.querySelector('#current-turn-txt');
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

    // Init function
    (function init() {
      console.log('Init Game');
      state.playerName = 'Patrick';
      addConsoleMessage(
        chatMessagesList,
        strings.getInitialGameConsoleString(),
      );
      chatInput.focus();
      currentRountText.innerHTML = '0';
      currentTurnText.innerHTML = strings.getInitialCurrentTurnString();

      // Initialize Player Grids
      initializePlayerGrids();

      // Register UI Event Listeners
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
        if (confirm(strings.getLeaveConfirmText())) window.location = '';
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
      state.isGameInitialized = true;
    })();
  });

  // Init Player Grids
  function initializePlayerGrids() {}

  // Add console message
  function addConsoleMessage(
    consoleElement,
    messageTxt,
    senderName = '[System]',
  ) {
    consoleElement.innerHTML += `<li><strong>${senderName}</strong>: ${messageTxt}</li>`;
    consoleElement.scrollTop = consoleElement.scrollHeight;
  }

  // Toggle Fullscreen Fn
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

  // Utility Functions
  // ...
})(window, window.document);
