(function (w, d) {
  // Global State
  const state = {
    playerName: '',
  };

  // Strings
  const strings = {};

  d.addEventListener('DOMContentLoaded', () => {
    // UI References
    const createGameBtn = d.querySelector('#create-btn');
    const joinGameBtn = d.querySelector('#join-btn');
    const tabTriggers = d.querySelectorAll('.tab-trigger');
    const showRulesBtn = d.querySelector('#show-rules-btn');
    const toggleMusicBtn = d.querySelector('#toogle-music-btn');
    const toggleSoundBtn = d.querySelector('#toogle-sound-btn');
    const toggleFullScreenBtn = d.querySelector('#toggle-fullscreen-btn');
    const showCreditsBtn = d.querySelector('#show-credits-btn');

    // Init function
    (function init() {
      state.playerName = localStorage.getItem('playerName') || '';

      // Register UI Event Listeners
      tabTriggers.forEach((tabTrigger) => {
        tabTrigger.addEventListener('click', (e) => {
          const allTabs = d.querySelectorAll('.tab');
          allTabs.forEach((tab) => tab.classList.add('hidden'));
          d.querySelector(`#${e.target.dataset.targets}`).classList.remove(
            'hidden',
          );
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

      showCreditsBtn.addEventListener('click', (e) => {
        console.log('Show Credits Btn Pressed!');
      });
    })();
  });

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
})(window, window.document);
