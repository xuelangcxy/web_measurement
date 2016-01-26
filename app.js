var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var hbs = require('hbs');
var mongoose = require('mongoose');
var hash = require('./pass').hash;
var MongoStore = require('connect-mongo')(session);


var app = express();
app.listen(3000);

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.use(session({
	cookie: {maxAge: 1000 * 60 * 60},//an hour
	secret: 'randomBytes',
	store: new MongoStore({db:"myapp"})
}));

mongoose.connect('mongodb://localhost/myapp');
var UserSchema = new mongoose.Schema({
	username: String,
	userpwd: String,
	pwdsalt: String,
	pwdhash: String
});
var userModel = mongoose.model("users", UserSchema);

/*
Help functions
*/
function authenticate (name, pwd, callback) {
	//search user with name, then hash it
	userModel.findOne({
		username: name
	}, 

	function (err, user) {
		if (user) {
			if (err) {throw err;}
			hash(pwd, user.pwdsalt, function (err, hash) {
				if (err) {throw err;}
				if (hash == user.pwdhash) {
					console.log("welcome " + user.username + "!");
					return callback(null, user);
				} else {
					console.log("invalid password!");
					return callback(null);
				}
			});
		} else {
			console.log("cannot find the user!");
			callback(null);
		}
		
	});
};

function userExist (req, res, next) {
	userModel.count({
		username: req.body.username
	},

	function (err, count) {
		if (count === 0) {
			next();
		} else{
			console.log("The username has been registed, please use another name!");
			res.redirect('/signin');
		}

	});
};


/* 
Routers
*/
app.get('/', function (req, res) {
	if (req.session.user) {
		res.redirect("/index");
	} else{
		res.render('choice');
	}
});
app.get('/index', function (req, res) {
	if (req.session.user) {
		res.render('index');
	}
});
app.get('/login', function (req, res) {
	if (req.session.user) {
		res.redirect("/index");
	} else{
		res.render('login');
	}
});
app.get('/signin', function (req, res) {
	if (req.session.user) {
		res.redirect("/index");
	} else{
		res.render('signin');
	}
});
app.get('/logout', function (req, res) {
    req.session.destroy(function () {
    	console.log("Thank you!")
        res.redirect('/');
    });
});

app.post('/login', function (req, res) {
	authenticate(req.body.username, req.body.password, function (err, user) {
		if (err) {throw err;}
		if (user) {
			req.session.regenerate(function() {
				req.session.user = user;
				req.session.success = 'Authenticated as ' + user.username + '. And welcome!';
				console.log(req.session.success);
				res.redirect('/index');
			});
		} else{
			req.session.error = 'Authentication failed, please check your username and password.';
			console.log(req.session.error);
			res.redirect('/login');
		}
	});
});

app.post('/signin', userExist, function (req, res) {
	var userName = req.body.username;
	var userPwd = req.body.password;
	console.log(userName);
	console.log(userPwd + '/n');

	hash(userPwd, function (err, salt, hash) {
		var user = new userModel({
			username: userName,
			userpwd: userPwd,
			pwdsalt: salt,
			pwdhash: hash
		});
		user.save(function (err, newUser) {
			if (err) {throw err;}
			authenticate(newUser.username, newUser.userpwd, function (err, user) {
				if (user) {
					req.session.regenerate(function(){
                        req.session.user = user;
                        req.session.success = 'Authenticated as ' + user.username + '. And welcome!';
                        console.log(req.session.success);
                        res.redirect('/index');
                    });
				}
			});
		});
	});

});