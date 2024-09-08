class Room {
  constructor(
    players,
    currentQuestionIndex,
    readyPlayers,
    timer,
    roundDuration
  ) {
    this.players = players;
    this.currentQuestionIndex = currentQuestionIndex;
    this.readyPlayers = readyPlayers;
    this.timer = timer;
    this.roundDuration = roundDuration;
  }
}

class Player {
  constructor(socketId, score, answered) {
    this.socketId = socketId;
    this.score = score;
    this.answered = answered;
  }
}

exports.Room = Room;
exports.Player = Player;