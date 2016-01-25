var crypto = require('crypto');

var len = 128;
var iterations = 12000;
// var password = '123456'
// var salt = '';

exports.hash = function (password, salt, callback) {
	// console.log(arguments);
	// console.log(arguments.length);
	if (3 == arguments.length) {
		crypto.pbkdf2(password, salt, iterations, len, callback);
	} else{
		callback = salt;
		// console.log(typeof(salt));
		// console.log(salt);
		// console.log(typeof(callback));
		crypto.randomBytes(len, function (err, salt) {
			if (err) {
				return callback(err);
			}
			// console.log(typeof(salt));
			salt = salt.toString('hex');
			// console.log(typeof(salt));

			crypto.pbkdf2(password, salt, iterations, len, function (err, hash) {
				if (err) {
					return callback(err);
				}
				// hash = hash.toString('hex');
				// console.log("salt is: " + salt);
				// console.log(hash);
				callback(null, salt, hash);
			});
		});
	}
};