![Ironhack Logo](https://i.imgur.com/1QgrNNw.png)

# Guided Project | Step 1 - Twitter

## Learning goals

After this lesson, you will be able to:

- Create database models with mongoose, based on what we want to do
- Create users and store their data in the database
- Let users log in our application and save their data in session and cookies
- Publish tweets from your account
- See all the tweets you have published

## Introduction

![](https://s3-eu-west-1.amazonaws.com/ih-materials/uploads/upload_eca494f0639e6b11f2d902e1078944c1.jpg)

In this Learning Unit we are going to create our own twitter clone! We are not going to implement the whole platform, but just some of the features it has: sign up, login, tweet, my tweets, follow users, and timeline.

We are going to split up this exercise in two learning units. In this first part, we will implement the sign up, the login and the logout. We will be able to publish tweets and see our tweets when we are logged in.

## Starter code

Let's start checking out our starter code. We have generated the starter code with [`express-generator`](https://expressjs.com/en/starter/generator.html), using the following command:

```bash
$ express twitter-lab --view=ejs --git
```

:::warning
:bulb: Remember you have to install the package `express-generator` globally before using it in the console:

```bash
$ npm install express-generator -g
```
:::

This command will create by default the `.gitignore` file, and will also install the `ejs` package in our project, adding the basic configuration to the `app.js` file.

It's a good idea to take a look at the `app.js` and make some style changes so it is more consistent with our use of ES6. More specifically, you can replace all the `var` occurences by `const` and use arrow functions for the callbacks instead of the `function` keyword.

We now need to install the packages already included in `package.json`:

```bash
$ npm install
```

Notice that we now have a `node_modules` directory and a `package-lock.json` file.

We need some other packages to start working in our project:[Mongoose](https://www.npmjs.com/package/mongoose), [EJS Layouts](https://www.npmjs.com/package/express-ejs-layouts) and [bcrypt](https://www.npmjs.com/package/bcrypt). Let's add them and install them:

```bash
$ npm install mongoose express-ejs-layouts bcrypt
```

Let's connect to mongoose by adding the following code in `app.js`:

```javascript
// app.js
const mongoose = require('mongoose');
// ...other code
mongoose.connect('mongodb://localhost/twitter-lab-development');
```

As you should know, the express server has to be restarted every time we change some code. To avoid doing this manually, we will use [nodemon](https://www.npmjs.com/package/nodemon)

:::warning
:bulb: Again, remember you have to install the package `nodemon` globally before using it in the console:

```bash
$ npm install nodemon -g
```
:::

To automatically use nodemon when we wish to start the server, we need to modify the `package.json` like this:

```javascript
{
  // ...
  "scripts": {
    "start": "nodemon ./bin/www"
  }
  // ...
}
```

We are now able to start the server in the command-line by typing `npm start`.

Before we start coding, we should configure our main layout to display all the views within the same layout. We will create it at the path `views/layouts/main-layout.ejs`, with the following content:

```htmlmixed=
<!-- views/layout/main-layout.ejs -->
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Ironhack Twitter</title>
</head>
<body>
  <div id="container">
    <img src="/images/twitter-logo.png" 
         class="header-logo">

    <%- body %>

  </div>
</body>
</html>
```

As you can see, we have also added an image with the twitter logo in the `public/images` folder. To make it smaller we need to add a rule in our stylesheet which located at `public/stylesheets/style.css`.

```css
/* public/stylesheets/style.css */

/* ...other rules */
.header-logo {
  height: 1.4rem;
}
```

Finally, we have to configure the middleware to load the layout in all the pages of the site. We do that in the `app.js` file:

```javascript
// app.js
const expressLayouts = require('express-ejs-layouts');

// ...other code
app.use(expressLayouts);
app.set("layout", "layouts/main-layout");
```

We are ready to start with our own twitter version! Now is a good idea to make your first commit. Happy coding!

## Authentication

If we visit [twitter](https://twitter.com/), the first thing we notice is the login form to access our profile. This is why authentication is one of the most important features in this project.

The main goal of the authentication is to securly identify users. It will allow them to access the platform, know who has published each tweet, and who is following them (or who they are following).

The authentication process requires an account creation before doing anything else, so this is the first thing we will do. A user will create an account by providing a username and a password.

### Sign-Up

#### Model

If we want to store our users data in the database, we have to create a model with Mongoose. As we said before, each user will have a username and a password, so let's create the model in the `models/user.js` file, with the following Schema:

```javascript
// models/user.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  password: String
}, {
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
```

Remember that an `_id` attribute will be added by default to all documents in the collection. Also, [timestamps](http://mongoosejs.com/docs/guide.html#timestamps) is a mongoose Schema option to save the time we created/updated a document automatically.

#### View

Now we have to create the view to sign up. We need to have a form with the different fields we will save in the database collection. 

This sign up form will be in the `/signup` route, so the users will have to go there to create an account for the platform.

We are going to add the following code in the `views/auth/signup.ejs` file:

```htmlmixed
<!-- views/auth/signup.ejs -->
<h2>Signup</h2>

<form action="/signup" method="POST" id="signup-form">
  <label>
    Username: 
    <input
      type="text"
      name="username" 
      placeholder="JonSnow">
  </label>
  <br>
  <label>
    Password:
    <input
      type="password"
      name="password" 
      placeholder="Your password">
  </label>
  <br>
  <button>Create account</button>
</form>
```

Now we have to create the corresponding routes and the code that will allow us create and save new user accounts.

#### Controller

We need two different routes to create a new user:

* The `GET` route to show the form, and 
* The `POST` route to receive the parameters and save the data in the database.
 
We will create those in the `routes/authController.js` file. There, we need to require some modules.

```javascript
// routes/authController.js
const express = require("express");
const authController = express.Router();

// User model
const User = require("../models/user");

// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;
```

:::info
We are requiring `bcrypt` to be able to encrypt the user's password before saving it in the database.
Make sure that it has been added to the `package.json` file.
:::

We define the first route as follows:

```javascript
// routes/authController.js

// ...other code
authController.get("/signup", (req, res, next) => {
  res.render("auth/signup");
});
```

It only renders the view we created in the `views/auth` folder. The `POST` route is more complicated. We have to do a few things:

- Get the data that the user has inserted in the form
- Check that he or she has correctly filled up both fields
- Check if the username already exists in the database
- If none of those conditions are met, we can save the user

```javascript
// routes/authController.js

// ...other code
authController.post("/signup", (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username === "" || password === "") {
    res.render("auth/signup", {
      errorMessage: "Indicate a username and a password to sign up"
    });
    return;
  }

  User.findOne({ "username": username }, "username")
    .then(user => {
      if (user !== null) {
        res.render("auth/signup", {
          errorMessage: "The username already exists"
        });
        return;
      }

      const salt = bcrypt.genSaltSync(bcryptSalt);
      const hashPass = bcrypt.hashSync(password, salt);

      const newUser = User({
        username,
        password: hashPass
      });

      newUser.save()
        .then(() => {
          // User has been created
          // For now we will redirect to the home page
          res.redirect('/');
        })
        .catch(err => {
          res.render("auth/signup", {
            errorMessage: "Something went wrong when signing up"
          });
        });
    });
});

module.exports = authController;
```

You can see how we send an `errorMessage` inside the second parameter of the `render` method to indicate why the sign up failed. We have to show this message in the view so you should add the following at the end of the form:

```htmlmixed
<!-- views/auth/signup.ejs -->
<!-- ...rest of the form -->
  <br>
  <% if (errorMessage !== undefined) { %>
    <div class="error-message"><%= errorMessage %></div>
  <% } %>
</form>
```

To finish up this section, we have to add the controller into the `app.js` file, as follows:

```javascript
// app.js
const authController = require('./routes/authController');
// ...other code
// Routes
app.use("/", authController);
```

If we launch the website with `npm start`, we will be able to find our form at the [`http://localhost:3000/signup`](http://localhost:3000/signup) URL. We should be able to create our first users :)

### Login

Now that we have created our first user, we want to give access to the platform. We need to create the login functionality to do that.
Once the user has logged in, we need to remember that he or she has. We will use sessions and cookies to do that.

#### Session and Cookies

We will use `express-session` to create a session and save the data of the logged user. We will also use `connect-mongo` to create a cookie and store it as a session backup in the database.

First, we need to install those packages:

```bash
$ npm install express-session connect-mongo
```

Then, we need to setup the sessions:

```javascript
// app.js
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);

// ...other code
// Make sure the following goes after you connect to the database
app.use(session({
  secret: "Pc6COelkx0Hp", // You can put any random string here
  cookie: {
    maxAge: 24 * 60 * 60 // 1 day
  },
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    ttl: 24 * 60 * 60 // 1 day
  }),
  resave: true,
  saveUninitialized: true
}));
```

#### View

The first step is to create the layout that the user will use to send his or her credentials, username and password to the server. We will create the following view in the `views/auth/login.ejs` file:

```htmlmixed
<!-- views/auth/login.ejs -->
<h2>Login</h2>

<form action="/login" method="POST" id="login-form">
  <label>
    Username: 
    <input
      type="text"
      name="username" 
      placeholder="JonSnow">
  </label>
  <br>
  <label>
    Password:
    <input
      type="password"
      name="password" 
      placeholder="Your password">
  </label>
  <br>
  <button>Sign in</button>
  <p class="account-message">
    Don't have an account? <a href="/signup">Sign up</a>
  </p>
  <% if (typeof(errorMessage) !== "undefined") { %>
    <div class="error-message"><%= errorMessage %></div>
  <% } %>
</form>
```

As with the signup form, a `div` containing the error message will be included if an error is raised.

Also, we have added a link under the signup form to let new users create an account if they don't have one. We should do the same in the sign up form. We can add the link in the `views/auth/signup.ejs` file:

```htmlmixed
<!-- views/auth/signup.ejs -->
<!-- ...form -->
  <p class="account-message">
    Do you already have an account? <a href="/login">Login</a>
  </p>
<!-- ...form -->
```

#### Controller

Now we can create the routes to allow the users to log in the app. Again, we need to create a `GET` and a `POST` over the endpoint `/login`. 

For `GET` we will show the view we created in the previous step.

For `POST` we will first check if the user has inserted his or her data correctly. We will then need to check that the user exists and that the hash of the provided password matches the stored one. If the checks pass we store the user data in the session. 

As with signup, the login functionality is related to authorization. As such we will add the following code in the `routes/authController.js` file:

```javascript
// routes/authController.js
authController.get("/login", (req, res, next) => {
  res.render("auth/login");
});

authController.post("/login", (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username === "" || password === "") {
    res.render("auth/login", {
      errorMessage: "Indicate a username and a password to log in"
    });
    return;
  }

  User
    .findOne(
      { "username": username },
      "_id username password following"
    )
    .then(user => {
      if (!user) {
        res.render("auth/login", {
          errorMessage: "The username doesn't exist"
        });
        return;
      }
      if (bcrypt.compareSync(password, user.password)) {
        req.session.currentUser = user;
        // Logged in
        // For now we redirect to the home page
        res.redirect("/");
      } else {
        res.render("auth/login", {
          errorMessage: "Incorrect password"
        });
      }
    })
    .catch(err => {
      console.error(err)
    });
});
```

We are ready to login! Try to fill up the form and see what happens.

### TODO

We may want to access the user data in any of our pages. By setting properties to `req.locals` we can set variables for our views without having to pass the data to the render method every time we need it.

In our case we will create a middleware that will save the user data stored in the session in `req.local.user`, if there is any. In `app.js`, before using the routers, we need to add:

```javascript
// app.js
// ...other code
app.use((req, res, next) {
  if (res.session) {
    res.locals.user = res.session.currentUser
  } else {
    res.locals.user = undefined
  }
  next()
})
```

Now that we have access to the `user` variable in our views, let's make use of it. If a user is logged, we will display a welcome message with his or her username on every page.

In `views/layouts/main-layout.ejs`, we add the following code right after the image:

```htmlmixed
<!-- views/layouts/main-layout.ejs -->
<!-- ...other code -->
<% if(user) { %>
<p>
  Welcome, <%= user.username %>!
</p>
<% } %>
```

We are now able to know at any time whether the right user is logged in or not.

### Auth redirections

As you can see, when a new user signs up or an existing user logs in, we just redirect to the home page. We can do better. The flow we want is:

- After the users create an account, they need to log in
- After the users log in, they will be able to see their tweets

First of all, let's add the redirection from the sign-up page to the login page. In the `POST` of `/signup` we will add a redirection to the login page.

```javascript
// routes/authController.js
// In the handler of authController.post("/signup"):
newUser.save()
  .then(() => {
    res.redirect("/login");
  })
  .catch(() => {
    res.render("auth/signup", {
      errorMessage: "Something went wrong when signing up"
    });
  });
```

Following the same logic, once the users log in, they should be redirected to their own page, where they can find their tweets. We will create this page later; for now, the `/tweets` route raise an error 404.

```javascript
// routes/authController.js
// In the handler of authController.post("/login"):
if (bcrypt.compareSync(password, user.password)) {
  req.session.currentUser = user;
  res.redirect("/tweets");
} else {
  res.render("auth/login", {
    errorMessage: "Incorrect password"
  });
}
```

We should add one more redirection. What happens when we visit the root of the website? Nothing very interesting... We should redirect the users to the login page, so they can log in with their credentials.

```javascript
// routes/authController.js
authController.get("/", (req, res) => {
  res.redirect("/login");
});
```

Because we don't need it anymore, we can remove the router that has been generated by default by `express-generator` as well as the homepage view.

```bash
$ rm routes/index.js
$ rm views/index.ejs
```

We also need to remove the reference to the router in `app.js`.
In `app.js`, please **REMOVE** the following lines:

```javascript
// app.js
// Somewhere at towards the top of the file, remove:
const index = require('./routes/index');
// Somewhere in the middle of file, remove:
app.use('/', index);
```

We have done the whole process of authorization. There is just one step left to cover: the logout.

### Logout

In the logout we will have to destroy the session. It's not a good practice to use the `GET` method for our logout route because `GET` routes should not change the state of the application. We will therefore use the `POST` method.

In the `authController` we have to add the following:

```javascript
authController.post("/logout", (req, res, next) => {
  if (!req.session.currentUser) { res.redirect("/"); return; }

  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/login");
    }
  });
});
```

As you can see, we check if we have started a session before destroying it.

Because we are using a `POST` method, we are not able to logout by simply typing the URL in the brower's address bar or by linking with an anchor tag; we need a form with a submit button.

When a user is logged in, we want a logout button to appear on every page. To do so, we will to add it to the main layout.
In `views/layout/main-layout.ejs`, inside the `if` block and right after the welcome message, we include the following code:

```javascript
// views/layouts/main-layout.ejs
// In the if(user) block, after the welcome paragraph:
<form action="/logout" method="POST" id="logout-form">
  <button>Log out</button>
</form>
```

You can now test if it works by logging in then logging out.

**Now we are ready to start tweeting!**

## Tweets

Now that we have the basic authentication setup, we should start implementing the main features of our Tweeter: adding and displaying tweets. The steps to add those are:

1. Create a Tweet model with Mongoose
2. Create a form to add tweet and a controller action
3. Create a view to display a user's tweets

Ready?

### Data Model

In order to add Tweets to our users, we will need to store them inside a new collection `tweets`. In mongoose, we need to create a new model to access it easily from our code.

Each tweet will contain a few attributes:

* `tweet`: *String* containing the user's tweet (140 characters maximum)
* `user_id`: *ObjectId* that relates a tweet to a user
* `user_name`: *String* with the username (so we don't have to query it each time)
* `created_at`: The time at which the tweet was created
* `updated_at`: The time at which the tweet was last updated

Let's create a `tweet.js` model:

```bash
$ touch models/tweet.js
```

We will first define a Mongoose schema (`tweetSchema`), then create a `Tweet` model and finally export it so we can use it in our application:

```javascript
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tweetSchema = new Schema({
  tweet: { 
    type: String, 
    required: [true, "Tweet can't be empty"]
  },
  user_id: { 
    type: Schema.Types.ObjectId, 
    ref: "User"
  },
  user_name: String,
}, {
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});

const Tweet = mongoose.model("Tweet", tweetSchema);

module.exports = Tweet;
```

After creating the `Tweet` model, we can use it by simply requiring the module and assigning it to a variable. For example, we could use the model to access our mongo database:

:::warning
:exclamation: Don't add the following code to your project.
:::

```javascript
const Tweet = require("./models/tweet");

mytweetTweet = new Tweet({
  tweet: "My first Tweet",
  user_id: "1",
  user_name: "Ironhacker"
});

mytweetTweet.save()
  .catch(err => { /* .. etc .. */ });
```

### Controller & View

Now that we have the model defined, we can start by creating a **tweet controller** that will manage all the actions directly related to tweets. Also, we will create a `tweets` folder in the `views` folder so we can group the views related to this controller.

```bash
$ touch routes/tweetsController.js
$ mkdir views/tweets
```

The root route should display the user's tweets. However, we will only display the username for now.

```javascript
// routes/tweetsController.js
const express = require("express");
const tweetsController = express.Router();

tweetsController.get("/", (req, res, next) => {
  res.render("tweets/index");
});

module.exports = tweetsController;
```

We need to create the view in `views/tweets/index.ejs`:

```htmlmixed
// views/tweets/index.ejs
<div class="container">
  <h2>Tweets of @<%= user.username %></h2>
</div>
```

The last step is to include our new controller in `app.js`. We will mount this controller on `/tweets`; this  means that all the routes defined in the controller will be prepended with `/tweets`:

```javascript
// app.js
// After the declaration of authController, add:
const tweetsController = require("./routes/tweetsController");

// After app.use("/", authController), add:
app.use("/tweets", tweetsController);
```

Now that we have the basic structure done, we can test that it works by going to [http://localhost:3000/tweets](http://localhost:3000/tweets)

:::warning
:exclamation: Make sure you're logged in or it will throw an error!
:::

### Protecting Routes

If we are not authenticated and we try to access the `/tweets` route, we will get an error; We can't find *username* because the value of `user` is `undefined`; and the value of `user` is `undefined` because there is no session yet.

We can add a basic middleware to our `tweetsController` to ensure that all actions must have an authenticated user; otherwise we will redirect to the login page:

```javascript
// routes/tweetsController.js
// Before the GET action on /, add:
tweetsController.use((req, res, next) => {
  if (req.session.currentUser) {
    next();
  }
  else {
    res.redirect("/login");
  }
});
```

### New tweet

We will add the *New Tweet* feature to our application in two steps:

1. Implementing the route and the view to show the *New Tweet* form
2. Implementing the route to receive the form post and create the tweet 

#### GET: New Tweet Form

To display the *New Tweet* form we first add a route in our controller:

```javascript 
// routes/tweetsController.js
// ...other code
tweetsController.get("/new", (req, res, next) => {
  res.render("tweets/new");
});
```

We should add a `views/tweets/new.ejs` view with a form that contains the tweet input:

```htmlmixed
<!-- views/tweets/new.ejs -->
<div class="container">
  <h2>Adding a new tweet</h2>

  <form action="/tweets" method="POST" id="new-tweet-form">
    <label>Tweet
      <input
        type="text"
        name="tweetText"
        maxlength="140"
        placeholder="What's going on?">
    </label>
    <button>Tweet!</button>
    <% if (typeof(errorMessage) !== "undefined") { %>
      <div class="error-message"><%= errorMessage %></div>
    <% } %>
  </form>
</div>
```

The form will POST the `tweetText` to a new action (`/tweets`) that will receive the tweet and add it to the database.

#### POST: Create New Tweet

Because we will need to use the `Tweet` model, we first need to import it:

```javascript
// routes/tweetsController.js
// At the top, add:
const Tweet = require("../models/tweet");
```

Now we will add the logic to save the tweet:

1. Get the authenticated user
1. Create a new tweet instance and fill it with the provided information
1. Save it to the database
1. If OK: Redirect to `/tweets` 
1. If not OK: Add an `errorMessage` and render `tweets/new`

```javascript
// routes/tweetsController.js
// ...other code
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
```

You can test that creating a new tweet works by opening a mongo shell and querying for the `tweets` collection.

### My tweets

Now that wew have tweets, we should show them in our `tweets` page!

All we need to do is modify our controller to:

1. Find the current user
2. Find all her tweets and sort them by descending creation date
3. Pass them to our `index` view

We will use [MomentJS](https://momentjs.com/) to format our dates. You can install it as usual:

```bash
$ npm install moment
```

:::info
:bulb: Notice that in order to use `moment` in the views we need to require it from the controller and then pass it to the views as a parameter
:::

```javascript
// routes/tweetsController.js
// Towards the top, add:
const moment = require("moment");
// Instead of the original GET action on /, put:
tweetsController.get("/", (req, res, next) => {
  const user = req.session.currentUser

  Tweet
    .find(
      { "user_name": user.username },
      "tweet user_name user_id created_at"
    )
    .sort({ created_at: -1 })
    .then((tweets) => {
      res.render("tweets/index", {
        tweets,
        moment
      });
    });
});
```

Our `index` view will just iterate over all the tweets.
It will also include a link to the *New Tweet* form.

```htmlmixed
// views/tweets/index.ejs
<div class="container">
  <a href="/tweets/new">New tweet</a>

  <h2>Tweets of @<%= user.username %></h2>

  <% tweets.forEach((tweet) => { %>
    <div class="tweet-container">
      <p class="author">
        @<%= tweet.user_name %>
      </p>
      <p class="tweet">
        <%= tweet.tweet %>
      </p>
      <p class="date">
        <%= moment(tweet.created_at).format("LL, LTS") %>
      </p>
    </div>
  <% }) %>
</div>
```
## Summary

In this learning unit we have seen how to create mongoose models based on what we want to build in our website. We have seen how to structure a project to separate the functionalities in different files. We have also created sessions and saved them in the database as a backup, and we created the necessary code to publish tweets from our profile.
