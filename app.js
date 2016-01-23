var express = require('express');
// var http = require("http");
var app = express();
var hbs = require('hbs');
var blogEngine = require('./blog');
app.use(express.static('public'));

app.set('view engine', 'html');
app.engine('html', hbs.__express);
// app.use(express.bodyParser());

app.get('/', function(req, res) {
   res.render('index',{title:"最近文章", entries:blogEngine.getBlogEntries()});
});
 
// app.get('/about', function(req, res) {
//    res.render('about', {title:"自我介绍"});
// });
 
// app.get('/article/:id', function(req, res) {
//    var entry = blogEngine.getBlogEntry(req.params.id);
//    res.render('article',{title:entry.title, blog:entry});
// });

app.listen(8000);