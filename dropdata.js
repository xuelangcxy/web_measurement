var mongoose = require('mongoose');

var dbUri = "mongodb://localhost/myapp";
mongoose.connect(dbUri, function() {
    var db = mongoose.connection.db;
    db.dropDatabase(function(err) {
        if (err) return cb(err);
	    mongoose.disconnect();
    });
});