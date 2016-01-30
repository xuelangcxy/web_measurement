# 《史密斯圆图计算Calculating and Drawing Based on Smith Chart》

## 简介

用 node 搭建的一个 web app ，多用户注册登录连接至服务器，通过用户输入 Smith 圆图所需的基本参数，调用 Matlab 来计算出结果并绘制仿真出 Smith 圆图返回给用户。

## 页面展示

 - web app 主页面：
<br> 
![](https://github.com/dorkpon/web_measurement/raw/master/readmePic/home.png)

 - node.js 服务器端处理过程 console.log ：
 <br>
![](https://github.com/dorkpon/web_measurement/raw/master/readmePic/calculate.png)

 - 处理结果返回：
<br> 
![](https://github.com/dorkpon/web_measurement/raw/master/readmePic/result.png)

## 使用的框架

主要运用了基于 node.js 的 web 开发框架 express ，以及 mongodb 数据库。 

`web_measurement`@0.0.1

 - body-parser@1.14.2
 - connect-mongo@0.8.2
 - cookie-parser@1.4.1
 - express@4.13.3
 - express-session@1.13.0
 - hbs@4.0.0
 - mongoose@4.3.7

## 项目结构

- `node_modules` 

- `views` 
    - choice.html //welcome选择注册或登录界面
    - register.html //注册界面
    - login.html //登录界面
    - index.html //用户主页面
    - result.html //结果返回页面

- `app.js` //nodejs主程序
- `pass.js` //对用户输入的密码加密
- `calculate.js` //调用Matlab子程序完成运算返回结果
- `dropdata.js` //清空用户信息数据库

## 算法思路  功能实现
### 1. app.js
#### 模块依赖

添加nodejs需要依赖的模块

```js
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

```
### 配置中间件

配置好应用所需要使用和定义的内容项：处理body传来的请求，文件存储位置，渲染模板引擎，session，cookie

```js
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

```

### 数据库和模型

数据库使用mongodb，存在本地`localhost/myapp`中。指定数据库存储的内容：用户名、密码、哈希盐、哈希值

```js
mongoose.connect('mongodb://localhost/myapp');
var UserSchema = new mongoose.Schema({
	username: String,
	userpwd: String,
	pwdsalt: String,
	pwdhash: String
});
var userModel = mongoose.model("users", UserSchema);
```

### 辅助函数 Help Function

**验证函数：**
以用户名和密码作为参数，以用户名索引数据库里的用户，若存在，则接着检查密码的正确性，正确的话回调user。

```js
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
```

**用户存在判断函数:**
以用户名索引数据库里面的用户，回调返回出现的次数`count`后，对`count`进行处理判断用户名是否被注册。

```js
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
```

### 路由 Routers



