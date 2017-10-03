const express = require("express");
const moment = require("moment");
const tweetsController = express.Router();

const Tweet = require("../models/tweet");

tweetsController.use((req, res, next) => {
  if (req.session.currentUser) { next(); }
  else { res.redirect("/login"); }
});

tweetsController.get("/", (req, res, next) => {
  const user = req.session.currentUser

  Tweet
    .find(
      { "user_name": user.username },
      "tweet user_name user_id created_at"
    )
    .sort({ created_at: -1 })
    .then((tweets) => {
      console.log(tweets);
      res.render("tweets/index", {
        tweets,
        moment
      });
    });
});

tweetsController.get("/new", (req, res, next) => {
  res.render("tweets/new");
});

tweetsController.post("/", (req, res, next) => {
  const user = req.session.currentUser;
  console.log("user", user)

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