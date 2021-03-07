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
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
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
  const { userId, description, duration, date = "" } = req.body;
  // console.log(userId, description, duration);
  const dateString = date === "" ? new Date() : new Date(date);

  // console.log(dateString);
  if (!userId || !description || !duration || !dateString) {
    return res.send("Please send data in correct format");
  }
  User.findById(userId, (error, user) => {
    if (error) return res.send("Please send data in correct format");
    user.log.push({
      description,
      duration,
      date: dateString,
    });
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
  console.log({ query: req.query });
  const { userId, from, to, limit = 0 } = req.query;
  if (!userId) {
    return res.send("userid unknown");
  }
  User.findById(
    userId,
    {
      username: 1,
      log: { description: 1, duration: 1, date: 1 },
    },
    (error, user) => {
      if (error || !user) return res.send("Please Use correct user id");

      let { _id, username, log } = user;

      if (from || to) {
        console.log(Date.parse(from), Date.parse(to), new Date(from));
        log = log.filter((item) => {
          if (from && to)
            return item.date >= new Date(from) && item.date <= new Date(to);
          else if (from) return item.date >= new Date(from);
          else if (to) return item.date >= new Date(to);
          else return "";
        });
      }
      limit !== 0 ? (log = log.slice(0, limit)) : "";

      res.json({
        _id,
        username,
        count: log.length,
        log: log.map((exercise) => {
          const { duration, description, date: dateString } = exercise;
          return {
            date: new Date(dateString).toDateString(),
            duration,
            description,
          };
        }),
      });
    }
  );
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
