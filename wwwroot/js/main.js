(function (w, d) {
  // Global State
  const state = {
    playerId: localStorage.getItem('playerId') || '',
    games: [],
  };

  // Strings
  const strings = {};

  d.addEventListener('DOMContentLoaded', () => {
    // UI References
    const tabTriggers = d.querySelectorAll('.tab-trigger');
    const secondaryButtons = d.querySelectorAll('.secondary-btn');
    const gamesList = d.querySelector('#games-list');
    const joinForm = d.querySelector('#join-form');
    const createForm = d.querySelector('#create-form');

    // Init function
    (async function init() {
      if (state.playerId === '') {
        state.playerId = generateUUID();
        localStorage.setItem('playerId', state.playerId);
      }

      // Get list of available games from server
      state.games = await fetchGames();
      updateGamesList(state.games, gamesList);

      [joinForm, createForm].forEach((form) => {
        const hiddenInput = d.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.value = state.playerId;
        hiddenInput.name = 'playerId';
        form.appendChild(hiddenInput);
      });

      // Register UI Event Listeners
      tabTriggers.forEach((tabTrigger) => {
        tabTrigger.addEventListener('click', async (e) => {
          const elementId = e.target.closest('button').id;

          const allTabs = d.querySelectorAll('.tab');
          allTabs.forEach((tab) => tab.classList.add('hidden'));
          d.querySelector(`#${e.target.dataset.targets}`).classList.remove(
            'hidden',
          );

          if (elementId === 'join-btn') {
            state.games = await fetchGames();
            updateGamesList(state.games, gamesList);
          }
        });
      });

      secondaryButtons.forEach((button) => {
        button.addEventListener('click', async (e) => {
          const elementId = e.target.closest('button').id;

          switch (elementId) {
            case 'refresh-games-btn':
              e.preventDefault();
              state.games = await fetchGames();
              updateGamesList(state.games, gamesList);
              break;
            case 'toggle-music-btn':
              console.log('Toggle Music Btn Pressed!');
              alert('Coming Soon!');
              break;
            case 'toggle-sound-btn':
              console.log('Toggle Sound Btn Pressed!');
              alert('Coming Soon!');
              break;
            case 'toggle-fullscreen-btn':
              toggleFullScreen(d.body);
              break;
          }
        });
      });
    })();
  });

  // Update games list
  function updateGamesList(gamesData, gamesListElement) {
    gamesListElement.innerHTML = '';

    gamesData.forEach((game) => {
      if (game.players[0].id !== state.playerId) {
        gamesListElement.innerHTML += `
        <option value="${game.id}">${game.gameName} (${game.players.length}/2)</option>
       `;
      }
    });
  }

  // Fetch list of games from server
  async function fetchGames() {
    const games = await (await fetch('/games')).json();
    return games;
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
})(window, document);

const generateUUID = () =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);
