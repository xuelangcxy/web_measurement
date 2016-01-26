var crypto = require('crypto');

var len = 128; 
var iterations = 12000;
// var password = '123456'
// var salt = '';

exports.hash = function (password, salt, callback) {
	if (3 == arguments.length) { //when authenticating we need three parameter
		crypto.pbkdf2(password, salt, iterations, len, callback); //call hmac when encrypting
	} else{
		callback = salt; //let typeof(callback) = function
		crypto.randomBytes(len, function (err, salt) {
			if (err) {
				return callback(err);
			}
			salt = salt.toString('hex');

			crypto.pbkdf2(password, salt, iterations, len, function (err, hash) {
				if (err) {
					return callback(err);
				}
				callback(null, salt, hash);
			});
		});
	}
};