const express = require("express");
const path = require("path");
const axios = require('axios')
const User = require("./models/users");
const History = require("./models/history");
const bcrypt = require('bcrypt');
require("dotenv").config();
const { log } = require("console");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const app = express();


app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.urlencoded({ extended: true }))

app.use(session({
  secret: "superSecretKey", 
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, 
  }),
  cookie: {
    maxAge: 1000 * 60 * 60
  }
}));


function isLoggedIn(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/signin");
  }
  next();
}


app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/signin", (req, res) => {
  res.render("signin");
});

app.get("/account", isLoggedIn, (req, res) => {
  res.render("account", { user: req.session.user });
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});


app.post("/signup", async (req, res) => {
  const data = {
    name: req.body.username,
    password: req.body.password,
    email: req.body.email
  };

  const UserExists = await User.findOne({ name: data.name });
  const findmail = await User.findOne({ email: data.email });

  if (UserExists) {
    return res.send(`<body style=" background-color: rgb(24, 24, 24);"><p style="font-family: monospace;font-size:large; text-align:center;color:white;">
Choose a different username... <br>
Name already in use...       
<br><br>     
<a href="signup" style="color:red;text-decoration: none;">
Back ← </a></p></body>`);
  } else if (findmail) {
    return res.send(`<body style=" background-color: rgb(24, 24, 24);"><p style="font-family: monospace;font-size:large; text-align:center;color:white;">
Email already in use ... 
<a href="signin" style="color:red;text-decoration: none;">
Login instead?</a></p></body>`);
  }

  const salt = 10;
  const hashedPassword = await bcrypt.hash(data.password, salt);
  data.password = hashedPassword;

  const userdata = await User.insertMany(data);
  const user = userdata[0];

  req.session.user = {
    id: user._id,
    name: user.name,
    email: user.email
  };

  res.redirect("/home");
});


app.post("/signin", async (req, res) => {
  try {
    const look = await User.findOne({ name: req.body.username });
    if (!look) {
      return res.send(`<body style=" background-color: rgb(24, 24, 24);"><p style="font-family: monospace;font-size:large; text-align:center;color:white;">
Cannot find this user ... 
<a href="signup" style="color:red;text-decoration: none;">
Create an account instead?</a></p></body>`);
    }

    const passwordMatches = await bcrypt.compare(req.body.password, look.password);
    if (!passwordMatches) {
      return res.send("Wrong Password...Try again");
    }

    req.session.user = {
      id: look._id,
      name: look.name,
      email: look.email
    };

    res.redirect("/home");
  } catch (err) {
    console.error(err);
    res.send("Wrong Input .. Try Again");
  }
});




app.post("/update", isLoggedIn, async (req, res) => {
  try {
    const newName = req.body.newName;

    const exists = await User.findOne({ name: newName });
    if (exists) return res.send("Username already taken");

    const updated = await User.findOneAndUpdate(
      { _id: req.session.user.id },
      { $set: { name: newName } },
      { new: true }
    );

    req.session.user.name = newName;
    res.redirect("/account");
  } catch (err) {
    console.error(err);
    res.send("Error updating username");
  }
});


app.post("/delete", isLoggedIn, async (req, res) => {
  try {
    await User.findOneAndDelete({ _id: req.session.user.id });
    req.session.destroy(() => {
      res.send(`<body style="background-color: rgb(24, 24, 24);"><p style="font-family: monospace;font-size:large; text-align:center;color:white;">
Account deleted successfully.<br>
<a href="/signup" style="color:red;text-decoration: none;">Sign up again?</a></p></body>`);
    });
  } catch (err) {
    console.error(err);
    res.send("Error deleting account");
  }
});

app.get("/home", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/signin");
  }

  try {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const clip = await History.find({ "date.month": month.toString(), "date.day": day.toString(), category: "event" }).limit(5);
    const birth = await History.find({ "date.month": month.toString(), "date.day": day.toString(), category: "birth" }).limit(5);
    const death = await History.find({ "date.month": month.toString(), "date.day": day.toString(), category: "death" }).limit(5);

    res.render("home", {
      today: `${month}/${day}`,
      clip,
      birth,
      death,
      user: req.session.user
    });

  } catch (error) {
    console.error("Error fetching history data:", error.message);

    res.render("home", {
      today: "",
      clip: [],
      birth: [],
      death: [],
      user: req.session.user
    });
  }
});








app.get("/today", async (req, res) => {
  try {
    const now = new Date();
    const month = (now.getMonth() + 1).toString();
    const day = now.getDate().toString();

    const events = await History.find({
      category: "event",
      "date.month": month,
      "date.day": day
    });

    const today = `${month}-${day}`;
    res.render("today", { today, events });
  } catch (error) {
    console.error("Error fetching today's events:", error.message);
    res.send("Error fetching today's events ......");
  }
});

app.get("/births", async (req, res) => {
  try {
    const now = new Date();
    const month = (now.getMonth() + 1).toString();
    const day = now.getDate().toString();

    const births = await History.find({
      category: "birth",
      "date.month": month,
      "date.day": day
    });

    const today = `${month}-${day}`;
    res.render("births", { today, births });
  } catch (error) {
    console.error("Error fetching today's births:", error.message);
    res.send("Error fetching today's Births .....");
  }
});


app.get("/deaths", async (req, res) => {
  try {
    const now = new Date();
    const month = (now.getMonth() + 1).toString();
    const day = now.getDate().toString();

    const deaths = await History.find({
      category: "death",
      "date.month": month,
      "date.day": day
    });

    const today = `${month}-${day}`;
    res.render("deaths", { today, deaths });
  } catch (error) {
    console.error("Error fetching today's deaths:", error.message);
    res.send("Error fetching today's Deaths .....");
  }
});




app.get("/", async (req, res) => {
  try {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const clip = await History.find({ "date.month": month.toString(), "date.day": day.toString(), category: "event" }).limit(5);
    const birth = await History.find({ "date.month": month.toString(), "date.day": day.toString(), category: "birth" }).limit(5);
    const death = await History.find({ "date.month": month.toString(), "date.day": day.toString(), category: "death" }).limit(5);

    res.render("index", {
      today: `${month}/${day}`,
      clip,
      birth,
      death,
    });
  } catch (error) {
    console.error(error);
  }
});


app.get("/search", async (req, res) => {
  const query = req.query.q?.toLowerCase();
  if (!query) {
    return res.redirect("/home");
  }

  try {
    const results = await History.find({
      $or: [
        { year: { $regex: query, $options: "i" } },
        { text: { $regex: query, $options: "i" } }
      ]
    });

    const eventResults = results.filter(r => r.category === "event");
    const birthResults = results.filter(r => r.category === "birth");
    const deathResults = results.filter(r => r.category === "death");

    res.render("search", {
      query,
      eventResults,
      birthResults,
      deathResults
    });

  } catch (error) {
    console.error("Error searching history:", error.message);
    res.send("Error searching data.");
  }
});

app.get("/today_search", async (req, res) => {
  const query = req.query.q?.toLowerCase();
  if (!query) {
    return res.redirect("/home");
  }

  try {
    const now = new Date();
    const month = (now.getMonth() + 1).toString();
    const day = now.getDate().toString();

    const results = await History.find({
      "date.month": month,
      "date.day": day,
      $or: [
        { year: { $regex: query, $options: "i" } },
        { text: { $regex: query, $options: "i" } }
      ]
    });

    const eventResults = results.filter(r => r.category === "event");
    const birthResults = results.filter(r => r.category === "birth");
    const deathResults = results.filter(r => r.category === "death");

    res.render("today_search", {
      query,
      eventResults,
      birthResults,
      deathResults
    });

  } catch (error) {
    console.error("Error searching today's history:", error.message);
    res.send("Error searching today's data.");
  }
});


app.get("/death_search", async (req, res) => {
  const query = req.query.q?.toLowerCase();
  if (!query) {
    return res.redirect("/death");
  }

  try {
    const results = await History.find({
      $or: [
        { year: { $regex: query, $options: "i" } },
        { text: { $regex: query, $options: "i" } }
      ]
    });

    const deathResults = results.filter(r => r.category === "death");

    res.render("death_search", {
      query,
      deathResults
    });

  } catch (error) {
    console.error("Error searching history:", error.message);
    res.send("Error searching data.");
  }
});



app.get("/birth_search", async (req, res) => {
  const query = req.query.q?.toLowerCase();
  if (!query) {
    return res.redirect("/birth");
  }

  try {
    const results = await History.find({
      $or: [
        { year: { $regex: query, $options: "i" } },
        { text: { $regex: query, $options: "i" } }
      ]
    });

    const birthResults = results.filter(r => r.category === "birth");

    res.render("birth_search", {
      query,
      birthResults
    });

  } catch (error) {
    console.error("Error searching history:", error.message);
    res.send("Error searching data.");
  }
});



app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/signin");
  });
});


const port = 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
});
