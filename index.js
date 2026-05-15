require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const http = require("http"); 
const { Server } = require("socket.io"); 

connectDB();
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("🟢 Live User Connected:", socket.id);

  socket.on("join-poll", (pollId) => {
    socket.join(pollId);
    console.log(`User joined Poll Room: ${pollId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 User Disconnected:", socket.id);
  });
});

app.use(express.json());

app.use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/polls", require("./routes/pollRoutes"));

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server & Socket.io is live on port ${PORT} 🚀`);
});