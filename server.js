const express = require("express");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
var cookie = require("cookie");
const { Room, Player } = require("./classes");
/* --------KONFIGURÁCIÓK---------- */
const app = express();
const port = 3000;
const server = app.listen(port, () => {
  console.log(`Teszt app:  http://localhost:${port}`);
});
const io = require("socket.io")(server, {
  cors: {
    origin: {
      "http://127.0.0.1:3000": true,
      "http://localhost:3000": true,
    },
    methods: ["GET", "POST"],
    cookie: true,
    cookie: {
      name: "io",
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    },
  },
});
/* --------MIDDLEWARE---------- */
app.use(express.urlencoded({ extended: "false" }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "/public")));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.set("views", "./public/views");
/* --------VÁLTOZÓK---------- */
let clients = {};
let rooms = {};
let clientId;
let resultTimer;
/* --------FÜGGVÉNYEK---------- */
function findClient(req, res) {
  if (req.cookies.clientId) {
    clientId = req.cookies.clientId;
    return true;
  } else {
    res.render("login");
    return false;
  }
}
/* --------Teszt adatok---------- */
function fetchQuestions() {
  return [
    {
      question: "Melyik a legnagyobb sziget?",
      answers: ["Ausztrália", "Grönland", "Madagaszkár", "Szumátra"],
      correctAnswer: "Ausztrália",
    },
    {
      question: "Melyik a legnagyobb állat?",
      answers: [
        "Kék bálna",
        "Elefánt",
        "Vörös óriáskenguru",
        "Afrikai elefánt",
      ],
      correctAnswer: "Kék bálna",
    },
    {
      question: "Melyik a legnagyobb folyó?",
      answers: ["Amazonas", "Mississippi", "Nílus", "Duna"],
      correctAnswer: "Amazonas",
    },
  ];
}
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function showResults(roomCode, questions) {
  io.to(roomCode).emit("roundEnded", rooms[roomCode].players);
  if (
    rooms[roomCode].currentQuestionIndex > 0 &&
    rooms[roomCode].currentQuestionIndex <= questions.length
  ) {
    resultTimer = setTimeout(() => {
      clearTimeout(resultTimer);
      nextRound(questions, roomCode);
    }, 5000);
  }
}
function nextRound(questions, roomCode) {
  /* --------KÉRDÉS---------- */
  const question = questions[rooms[roomCode].currentQuestionIndex];
  timer = rooms[roomCode].roundDuration;
  /* --------KÖR---------- */
  io.to(roomCode).emit("roundStarted", question, timer);
  clearTimeout(rooms[roomCode].timer);
  rooms[roomCode].currentQuestionIndex++;
  rooms[roomCode].readyPlayers = 0;
  /* --------TIMER---------- */
  rooms[roomCode].timer = setTimeout(() => {
    if (rooms[roomCode].currentQuestionIndex >= questions.length) {
      io.to(roomCode).emit("gameEnded", rooms[roomCode].players);
      clearTimeout(rooms[roomCode].timer);
      clearTimeout(resultTimer);
      delete rooms[roomCode];
    } else {
      showResults(roomCode, questions);
    }
  }, rooms[roomCode].roundDuration * 1000);
}
/* --------VIEWS---------- */
app.get("/", function (req, res) {
  if (findClient(req, res)) {
    res.render("index");
  }
});
app.post("/setuser", function (req, res) {
  let clientId = uuidv4();
  if (!req.body.clientId) {
    res.cookie(`clientId`, clientId, { maxAge: 43200000 }); // 12 hours
    res.redirect("/");
  } else {
    res.render("login");
  }
});
/* --------FÜGGVÉNYEK---------- */
function connected(socket) {
  var socketCookie = socket.handshake.headers.cookie;
  if (socketCookie) {
    socket.clientId = cookie.parse(socketCookie).clientId;
    clients[socket.clientId] = { clientId: socket.clientId };
  }
  /* ------------------ */
  socket.join("lobby");
}

function createRoom(socket) {
  const roomCode = generateRoomCode();
  rooms[roomCode] = new Room({}, 0, 0, null, 5);

  socket.join(roomCode);
  rooms[roomCode].players[socket.id] = new Player(socket.id, 0, false);

  socket.emit("roomCreated", roomCode);
  io.to(roomCode).emit("updatePlayers", Object.values(rooms[roomCode].players));
}

function joinRoom(socket, roomCode) {
  if (rooms[roomCode]) {
    socket.join(roomCode);
    rooms[roomCode].players[socket.id] = new Player(socket.id, 0, false);
    io.to(roomCode).emit(
      "updatePlayers",
      Object.values(rooms[roomCode].players)
    );
    socket.emit("roomJoined", roomCode);
  } else {
    socket.emit("roomNotFound");
  }
}

function disconnect(socket) {
  for (const roomCode in rooms) {
    const room = rooms[roomCode];
    if (room.players[socket.id]) {
      delete room.players[socket.id];
      io.to(roomCode).emit(
        "updatePlayers",
        Object.values(rooms[roomCode].players)
      );

      if (Object.keys(room.players).length === 0) {
        delete rooms[roomCode];
      }
    }
  }
}
/* --------ENDPOINTS---------- */
io.on("connection", (socket) => {
  connected(socket);
  socket.on("createRoom", () => {
    createRoom(socket);
  });
  socket.on("joinRoom", (roomCode) => {
    joinRoom(socket, roomCode);
  });
  socket.on("startGame", (roomCode) => {
    const questions = fetchQuestions();
    nextRound(questions, roomCode);
  });
  socket.on("playerAnswer", (roomCode, id, _) => {
    const questions = fetchQuestions();
    rooms[roomCode].players[id].answered = true;
    rooms[roomCode].readyPlayers++;
    if (
      rooms[roomCode].readyPlayers ===
      Object.keys(rooms[roomCode].players).length
    ) {
      showResults(roomCode, questions);
    }
  });
  socket.on("disconnect", () => {
    disconnect(socket);
  });
});
