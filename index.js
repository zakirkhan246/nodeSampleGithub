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


// Define Authentication routes.
// TODO: Define API paths in constants
app.get('/', function(req, res) {
    console.log(">> Trying to Render Home Page");

    if( req.user ){

    	var options = {
		  url: 'https://api.github.com/user/repos?access_token='+req.user.accessToken,
		  headers: {
		    'User-Agent': 'request'
		  }
		};	

    	request(options, (err, apires, body) => {
			if (err) { 
				return console.log(err); 
			}

			//console.log(JSON.parse(body));

			res.render('home', { user: req.user, user_repos: JSON.parse(body) });
		});
    }else{
    	res.render('home', { user: req.user });	
    }
    
});


// TODO: Define API paths in constants
app.get('/repo/:ownerId/:repoId', function(req, res){

	if( req.user ){

		let optionsRepo = {
		  url: 'https://api.github.com/repos/'+req.params.ownerId+'/'+req.params.repoId+'?access_token='+req.user.accessToken,
		  headers: {
		    'User-Agent': 'request'
		  }
		};	
		
    	let options = {
		  url: 'https://api.github.com/repos/'+req.params.ownerId+'/'+req.params.repoId+'/stats/participation?access_token='+req.user.accessToken,
		  headers: {
		    'User-Agent': 'request'
		  }
		};	

		request(optionsRepo, (errRepo, apiResRepo, bodyRepo) => {
			if (errRepo) { 
				return console.log(errRepo); 
			}

			//console.log(bodyRepo);	

			request(options, (err, apires, body) => {
				if (err) { 
					return console.log(err); 
				}

				//console.log(JSON.parse(body).all);
				//console.log(apires.headers)	

				let isCached = apires.headers['status']=='200 OK' ? true:false;
				let user_repo_commits = isCached ? JSON.parse(body).all: {}; 
				
				res.render('repository', { isCached: isCached, user: req.user, user_repo_commits: user_repo_commits, user_repo: JSON.parse(bodyRepo) });
			});
		});
    }else{
    	res.render('home', { user: req.user });	
    }

});

app.get('/login', function(req, res){
    res.render('login');
});

app.get('/login/github', passport.authenticate('github'));

app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res) {
  	console.log(">> User Authenticated - In Callback");
    res.redirect('/');
});

app.get('/profile', require('connect-ensure-login').ensureLoggedIn(), function(req, res){
    res.render('profile', { user: req.user });
});

app.listen(process.env.PORT || env.port);
