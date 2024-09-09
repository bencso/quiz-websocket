const socket = io("http://localhost:3000");
let timer = 0;

document.getElementById("createRoomButton").onclick = () => {
  socket.emit("createRoom");
};

document.getElementById("joinRoomButton").onclick = () => {
  let roomCode = document.getElementById("roomCodeInput").value;
  socket.emit("joinRoom", roomCode);
};

socket.on("roomCreated", (roomCode) => {
  document.getElementById("lobby").style.display = "none";
  document.getElementById("quiz").style.display = "block";
  document.getElementById("roomCode").innerText = roomCode;
});

socket.on("roomJoined", (roomCode) => {
  document.getElementById("lobby").style.display = "none";
  document.getElementById("quiz").style.display = "block";
  document.getElementById("roomCode").innerText = roomCode;
});

socket.on("roomNotFound", () => {
  alert("A megadott kóddal nem található szoba.");
});

socket.on("updatePlayers", (players) => {
  updatePlayersList(players);
});

socket.on("playerAnswered", (socketId, answer, readyPlayers) => {
  document.getElementById(
    "status"
  ).innerText = `${socketId} válaszolt: ${answer}`;
  document.getElementById(
    "ready"
  ).innerText = `Kész játékosok: ${readyPlayers}`;
});

socket.on("roundStarted", (questions, timerDuration) => {
  document.getElementById("timer").style.display = "block";
  document.getElementById("status").innerText =
    "A kör elkezdődött! Válaszolj a kérdésre!";
  document.getElementById("ready").innerText = "Kész játékosok: 0";
  timer = timerDuration;
  const timerInterval = setInterval(() => {
    timer--;
    document.getElementById("timer").innerText = timer;
    if (timer === 0) {
      clearInterval(timerInterval);
    }
  }, 1000);
  const question = questions;
  document.getElementById("question").innerText = question.question;
  const answers = document.getElementById("answers");
  answers.innerHTML = "";
  question.answers.forEach((answer) => {
    const answerElement = document.createElement("button");
    answerElement.innerText = answer;
    answerElement.onclick = () => {
      socket.emit(
        "playerAnswer",
        document.getElementById("roomCode").innerText,
        socket.id,
        answer
      );
    };
    answers.appendChild(answerElement);
  });
});

socket.on("roundEnded", (players) => {
  document.getElementById("status").innerText = "Vége a körnek!";
  document.getElementById("timer").style.display = "none";
  updatePlayersList(players);
});

socket.on("gameEnded", (players) => {
  document.getElementById("status").innerText = "Vége a játéknak!";
});

function updatePlayersList(players) {
  const playersDiv = document.getElementById("players");
  playersDiv.innerHTML = "";
  for (const id in players) {
    const player = players[id];
    const playerElement = document.createElement("div");
    playerElement.textContent = `${player.socketId}: ${player.score} pont`;
    playersDiv.appendChild(playerElement);
  }
}

document.getElementById("startGameButton").onclick = () => {
  socket.emit("startGame", document.getElementById("roomCode").innerText);
};

document.getElementById("testButton").onclick = () => {
  socket.emit(
    "playerAnswer",
    document.getElementById("roomCode").innerText,
    socket.id,
    "A"
  );
};
