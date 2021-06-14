class Game {
  constructor(id, gameName, players) {
    this.id = id;
    this.gameName = gameName;
    this.players = players;
    this.isListed = true;
    this.gameState = null;
  }

  isGameFull = () => this.players.length >= 2;
  isGameEmpty = () => this.players.length === 0;
  getNumberOfPlayers = () => this.players.length;
}

module.exports = Game;
