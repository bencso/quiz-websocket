// Változók
const socket = io("http://localhost:3000");
let timer = 0;
const elements = {
  lobby: document.getElementById("lobby"),
  quiz: document.getElementById("quiz"),
  roomCode: document.getElementById("roomCode"),
  players: document.getElementById("players"),
  question: document.getElementById("question"),
  answers: document.getElementById("answers"),
  timer: document.getElementById("timer"),
  ready: document.getElementById("ready"),
  status: document.getElementById("status"),
  createRoomButton: document.getElementById("createRoomButton"),
  joinRoomButton: document.getElementById("joinRoomButton"),
  roomCodeInput: document.getElementById("roomCodeInput"),
  startGameButton: document.getElementById("startGameButton"),
  testButton: document.getElementById("testButton"),
};
// Szoba manipulációk
elements.createRoomButton.onclick = () => {
  socket.emit("createRoom");
};
elements.joinRoomButton.onclick = () => {
  const roomCode = elements.roomCodeInput.value;
  socket.emit("joinRoom", roomCode);
};
socket.on("roomCreated", (roomCode) => {
  switchToQuizView(roomCode);
  createStartButton(roomCode);
});
socket.on("roomDeleted", resetLobbyView);
socket.on("roomJoined", switchToQuizView);
socket.on("roomNotFound", () => {
  alert("A megadott kóddal nem található szoba.");
});
socket.on("gameEnded", () => {
  elements.status.innerText = "Vége a játéknak!";
});
// Játékos függvények
socket.on("updatePlayers", updatePlayersList);
socket.on("playerAnswered", (socketId, answer, readyPlayers) => {
  elements.status.innerText = `${socketId} válaszolt: ${answer}`;
  elements.ready.innerText = `Kész játékosok: ${readyPlayers}`;
});
// Körös függvények
socket.on("roundStarted", startRound);
socket.on("roundEnded", (players) => {
  elements.status.innerText = "Vége a körnek!";
  updatePlayersList(players);
});
elements.startGameButton.onclick = () => {
  socket.emit("startGame", elements.roomCode.innerText);
};
elements.testButton.onclick = () => {
  socket.emit("playerAnswer", elements.roomCode.innerText, socket.id, "A");
};
// Segédfüggvények
function switchToQuizView(roomCode) {
  elements.lobby.style.display = "none";
  elements.quiz.style.display = "block";
  elements.roomCode.innerText = roomCode;
}
function resetLobbyView() {
  elements.lobby.style.display = "block";
  elements.quiz.style.display = "none";
  elements.players.innerHTML = "";
  elements.question.innerText = "";
  elements.answers.innerHTML = "";
  elements.timer.innerText = "";
  elements.ready.innerText = "";
  elements.status.innerText = "";
  elements.roomCode.innerText = "";
  elements.quiz.removeChild(elements.quiz.lastChild);
}
function createStartButton(roomCode) {
  const startBtn = document.createElement("button");
  startBtn.innerText = "Játék indítása";
  startBtn.onclick = () => {
    socket.emit("startGame", roomCode);
  };
  elements.quiz.appendChild(startBtn);
}
function startRound(questions, timerDuration) {
  elements.status.innerText = "A kör elkezdődött! Válaszolj a kérdésre!";
  elements.ready.innerText = "Kész játékosok: 0";
  timer = timerDuration;
  const timerInterval = setInterval(() => {
    timer--;
    elements.timer.innerText = timer;
    if (timer === 0) {
      clearInterval(timerInterval);
    }
  }, 1000);
  displayQuestion(questions);
}
function displayQuestion(question) {
  elements.question.innerText = question.question;
  elements.answers.innerHTML = "";
  question.answers.forEach((answer) => {
    const answerElement = document.createElement("button");
    answerElement.innerText = answer;
    answerElement.onclick = () => {
      socket.emit(
        "playerAnswer",
        elements.roomCode.innerText,
        socket.id,
        answer
      );
    };
    elements.answers.appendChild(answerElement);
  });
}
function updatePlayersList(players) {
  elements.players.innerHTML = "";
  for (const id in players) {
    const player = players[id];
    const playerElement = document.createElement("p");
    playerElement.textContent = `${player.socketId}: ${player.score} pont`;
    elements.players.appendChild(playerElement);
  }
}
