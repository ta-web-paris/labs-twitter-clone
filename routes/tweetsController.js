const express = require("express");
const tweetsController = express.Router();

const Tweet = require("../models/tweet");

tweetsController.use((req, res, next) => {
  if (req.session.currentUser) { next(); }
  else { res.redirect("/login"); }
});

tweetsController.get("/", (req, res, next) => {
  res.render("tweets/index");
});

tweetsController.get("/new", (req, res, next) => {
  res.render("tweets/new");
});

tweetsController.post("/", (req, res, next) => {
  const user = req.session.currentUser;

  const newTweet = new Tweet({
    user_id: user._id,
    user_name: user.username,
    tweet: req.body.tweetText
  });

  newTweet.save()
    .then(() => {
      res.redirect("/tweets");
    })
    .catch(err => {
      res.render("tweets/new", {
        errorMessage: err.errors.tweet.message
      });
    });
});

module.exports = tweetsController;