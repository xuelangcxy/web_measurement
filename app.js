var express = require('express');
var bodyParser = require('body-parser');
var hbs = require('hbs');
var mongoose = require('mongoose');
var hash = require('./pass').hash;

var app = express();

mongoose.connect('mongodb://localhost/myapp');
var UserSchema = new mongoose.Schema({
	username: String,
	userpwd: String,
	pwdsalt: String,
	pwdhash: String
});
var User = mongoose.model("users", UserSchema);

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.engine('html', hbs.__express);

function authenticate (name, pwd, callback) {
	User.findOne({
		username: name
	}, 

	function (err, user) {
		if (user) {
			if (err) {throw err;}
			hash(pwd, user.pwdsalt, function (err, hash) {
				if (err) {throw err;}
				if (hash == user.pwdhash) {
					console.log("user has registed!");
					return callback(null, user);
				} else {
					console.log("invalid password!");
				}
			});
		} else {
			console.log("cannot find the user!");
		}
		
	});
}

app.get('/', function (req, res) {
   res.render('choice');
});
app.get('/index', function (req, res) {
	res.render('index');
});
app.get('/login', function (req, res) {
	res.render('login');
});
app.get('/signin', function (req, res) {
	res.render('signin');
});

app.post('/login', function (req, res) {
	authenticate(req.body.username, req.body.password, function (err, user) {
		if (err) {throw err;}
		if (user) {
			res.redirect('/index');
		} else{
			res.redirect('/login');
		}
	})
});

app.post('/signin', function (req, res) {
	var userName = req.body.username;
	var userPwd = req.body.password;
	console.log(userName);
	console.log(userPwd + '/n');

	hash(userPwd, function (err, salt, hash) {
		var user = new User({
			username: userName,
			userpwd: userPwd,
			pwdsalt: salt,
			pwdhash: hash
		});
		user.save(function (err, newUser) {
			if (err) {throw err;}
			authenticate(newUser.username, newUser.userpwd, function (err, user) {
				if (user) {
					res.redirect('/index');
				}
			})
			// console.log(newUser.username);
			// console.log(newUser.userpwd);
			// console.log(newUser.pwdsalt);
			// console.log(newUser.pwdhash);
		});
	});

});

app.listen(3000);