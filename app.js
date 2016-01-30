var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var hbs = require('hbs');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session);
var hash = require('./pass').hash;
var calculateResult = require('./calculate.js').calculateResult;

var app = express();
app.listen(3000);

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.use(cookieParser());
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
			res.redirect('/register');
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
		res.render('index', {dataUser: req.session.user});
	} else {
		res.redirect('/')
	}
});
app.get('/login', function (req, res) {
	if (req.session.user) {
		res.redirect("/index");
	} else{
		res.render('login');
	}
});
app.get('/register', function (req, res) {
	if (req.session.user) {
		res.redirect("/index");
	} else{
		res.render('register');
	}
});
app.get('/logout', function (req, res) {
	// req.clearCookie('connect.sid');
	res.clearCookie('connect.sid', { path: '/' });
	req.session.user = null;
    req.session.destroy(function () {
        res.redirect('/');
    });
});
app.get('/fresh', function (req, res) {
	var userTmp = req.session.user;
	req.session.regenerate(function() {
		req.session.user = userTmp;
		req.session.success = 'Welcome ' + userTmp.username + ' again!';
		console.log(req.session.success);
		res.redirect('/index');
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

app.post('/register', userExist, function (req, res) {
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

app.post('/', function (req, res) {
	var trynum = {};
    var info = req.body;
    var sessionUser = req.session.user;
	if (sessionUser) {
		calculateResult(info, function (err, result) {
			if (err) {
				throw err;
			}
			trynum = {
				r1: result[0],
				x1: result[1],
				tr1: result[2],
				ti1: result[3],
				r2: result[4],
				x2: result[5],
				tr2: result[6],
				ti2: result[7],
				r3: result[8],
				x3: result[9],
				tr3: result[10],
				ti3: result[11],
				position: "pic/firstpicture.png"
			};
			console.log(trynum);
			res.render('result', {
				dataIn: info,
				dataOut: trynum,
				dataUser: sessionUser
			});
			console.log("\n" + "*******************finish calculate!" + "\n");
		});
	} else {
		res.redirect('/logout');
	}
    
});

process.on('uncaughtException', function (err) {
	console.log(err);
});
