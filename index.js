var express = require('express');
var passport = require('passport');
var request = require('request');
var fs = require("fs");
var GitHubStrategy = require('passport-github').Strategy;

// Read Environment Configs
var envConfigs = JSON.parse(fs.readFileSync('./config/env.json', "utf8"));
process.env.NODE_ENV = process.env.NODE_ENV ? process.env.NODE_ENV : 'dev';
var env = envConfigs[process.env.NODE_ENV];

// Initialize passport GitHib Strategy
passport.use(new GitHubStrategy({
    clientID: env.github.clientID,
    clientSecret: env.github.clientSecret,
    callbackURL: env.basepath+env.github.callbackURL
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log("<< User Authenticated - Profile recieved");
    profile.accessToken = accessToken;
    //console.log(profile);
    return cb(null, profile);
  }
));

// Configure Passport authenticated session persistence.
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});


// Create a new Express application.
var app = express();

// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

app.get('/login/github', passport.authenticate('github'));

app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res) {
  	console.log(">> User Authenticated - In Callback");
    res.redirect('/');
});

// Import Systme Routes
var routes = require('./routes');
app.use('/', routes);

// Specify the port for the application to run.
app.listen(process.env.PORT || env.port);
