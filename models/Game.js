class Game {
  constructor(id, players) {
    this.id = id;
    this.players = players;
  }

  isGameFull = () => (this.players.length >= 2 ? true : false);
  getNumberOfPlayers = () => this.players.length;
}

module.exports.default = Game;
