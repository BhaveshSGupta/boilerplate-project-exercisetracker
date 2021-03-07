const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const user = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  log: [
    {
      description: {
        type: String,
        required: true,
      },
      duration: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
    },
  ],
});
const User = mongoose.model("User", user);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/exercise/new-user", (req, res) => {
  const newUser = new User({ username: req.body.username });
  newUser.save({}, (error, doc) => {
    if (error) return res.send("Username already taken");
    res.json({ username: doc.username, _id: doc._id });
  });
});

app.get("/api/exercise/users", (req, res) => {
  User.find({}, "username , _id", (error, users) => {
    if (error) return res.send("No users found");
    res.json(users);
  });
});

app.post("/api/exercise/add", (req, res) => {
  const { userId, description, duration } = req.body;
  const date =
    req.body.date === ""
      ? new Date()
      : new Date(req.body.date) == "Invalid Date"
      ? ""
      : new Date(req.body.date);

  if (!userId || !description || !duration || !date) {
    return res.send("Please send data in correct format");
  }
  User.findById(userId, (error, user) => {
    if (error) return res.send("Please send data in correct format");
    user.log.push({ userId, description, duration, date });
    user.save((error, userdetails) => {
      if (error) return res.send("Please send data in correct format");
      const curr = userdetails.log[userdetails.log.length - 1];
      res.send({
        username: userdetails.username,
        _id: userdetails._id,
        description: curr.description,
        duration: curr.duration,
        date: curr.date.toDateString(),
      });
    });
  });
});

app.get("/api/exercise/log", (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.send("userid unknown");
  }
  User.findById(userId, (error, user) => {
    if (error || user <= 0) return res.send("Please Use correct user id");
    const { _id, username, log, __v: count } = user;
    res.json({ _id, username, log, count });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
