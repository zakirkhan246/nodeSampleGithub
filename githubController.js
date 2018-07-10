var request = require('request');
module.exports = {
    
    // Render Login Page
	login: function(req, res){
	    console.log(">> Logout Page");
	    res.render('login');
	},

	// Logout from application
	logout: function(req, res) {
		console.log(">> Logging Out");
	    req.logout(); 
	    res.redirect('/');
	},

	// Render home page with repo listing.
    home : function(req, res){
        console.log(">> Home Page");
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
    },

    // Render Repo Details.
    repoDetails: function(req, res){
    	console.log(">> Listing Page");
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

			console.log(options);

			request(optionsRepo, (errRepo, apiResRepo, bodyRepo) => {
				if (errRepo) { 
					return console.log(errRepo); 
				}

				//console.log(bodyRepo);	

				request(options, (err, apires, body) => {
					if (err) { 
						return console.log(err); 
					}

					let isCached = apires.headers['status']=='200 OK' ? true:false;
					let user_repo_commits = isCached ? JSON.parse(body).all: {}; 
					
					res.render('repository', { isCached: isCached, user: req.user, user_repo_commits: user_repo_commits, user_repo: JSON.parse(bodyRepo) });
				});
			});
	    }else{
	    	res.render('home', { user: req.user });	
	    }
    }
}