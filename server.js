const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // for parsing application/json

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

const jwt = require("jsonwebtoken");
const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");

const users = [];
const highScores = [];

const SECRET_KEY = "HELLO_SECRET_KEY";

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: SECRET_KEY,
};

passport.use(
  new JwtStrategy(opts, (jwtPayload, done) => {
    const user = users.find((u) => u.userHandle === jwtPayload.userHandle);
    if (user) {
      return done(null, user);
    }
    return done(null, false, { message: "Unauthorized" });
  })
);

app.use(passport.initialize());

app.post("/signup", (req, res) => {
  const { userHandle, password } = req.body;

  if (!userHandle || !password) {
    return res.status(400).json({ error: "Both userHandle and password are required" });
  }
  if (userHandle.length < 6 || password.length < 6) {
    return res.status(400).json({ error: "userHandle and password must be at least 6 characters long" });
  }

  users.push({ userHandle, password });
  res.status(201).json({ message: "User registered successfully" });
});

app.post("/login", (req, res) => {
  const { userHandle, password, ...extraFields } = req.body;

  //username and password field are required
  if (!userHandle || !password) {
    return res.status(400).json({ error: "Both userHandle and password are required" });
  }

  //display error if there are extra field other than username and password
  if (Object.keys(extraFields).length > 0) {
    return res.status(400).json({ error: "Unexpected fields in the request body" });
  }

  //display error if the username and password are not string
  if (typeof userHandle !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid data type for userHandle or password" });
  }

  //display error if username and password are not correct
  const user = users.find((u) => u.userHandle === userHandle && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Incorrect username or password" });
  }

  const token = jwt.sign({ userHandle }, SECRET_KEY, { expiresIn: "1h" });
  res.status(200).json({ jsonWebToken: token });
  console.log(token)
});

app.post(
  "/high-scores",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { level, userHandle, score, timestamp } = req.body;

    if (!level || !userHandle || !score || !timestamp) {
      return res.status(400).json({ error: "All fields (level, userHandle, score, timestamp) are required" });
    }

    highScores.push({ level, userHandle, score, timestamp });
    res.status(201).json({ message: "High score posted successfully" });
  }
);

app.get("/high-scores", (req, res) => {
  const { level, page = 1 } = req.query;

  if (!level) {
    return res.status(400).json({ error: "Level is required" });
  }

  const scoresForLevel = highScores
    .filter((hs) => hs.level === level)
    .sort((a, b) => b.score - a.score);

  const pageSize = 20;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedScores = scoresForLevel.slice(startIndex, endIndex);

  res.status(200).json(paginatedScores);
});

//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};
