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

前端页面主要使用了bootstrap框架构建。

后端服务器主要运用了基于 node.js 的 web 开发框架 express ，以及 mongodb 数据库。 

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

nodejs应用的主程序，处理

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
#### 配置中间件

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

#### 数据库和模型

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

#### 辅助函数 Help Function

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

#### 路由 Routers

用户通过某一个链接地址和服务器通信，并把服务器资源取到本地浏览器来，是GET请求。而用户将表单数据提交到服务器时，是一个POST动作，服务器获取到用户端传入的数据来进行处理，从而返回用户所需要的数据。

而nodejs就充当了这样一个偏后端服务器处理用户端数据的角色。

通过`req.session.user`来判断用户是否创建了session表明其已经登录过：

```js
app.get('/', function (req, res) {
	if (req.session.user) {
		res.redirect("/index");
	} else{
		res.render('choice');
	}
});
```
将user的用户名返回前端对象dataUsername显示在页面上：

```js
app.get('/index', function (req, res) {
	if (req.session.user) {
		res.render('index', {dataUsername: req.session.user.username});
	} else {
		res.redirect('/')
	}
});
```
登录、注册的跳转：

```js
app.get('/login', functison (req, res) {
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
```
退出时需要删除cookie以及结束删除session：

```js
app.get('/logout', function (req, res) {
	res.clearCookie('connect.sid', { path: '/' });
	req.session.user = null;
    req.session.destroy(function () {
        res.redirect('/');
    });
});
```
暂存session信息后重新赋值进而刷新页面：

```js
app.get('/fresh', function (req, res) {
	var userTmp = req.session.user;
	req.session.regenerate(function() {
		req.session.user = userTmp;
		req.session.success = 'Welcome ' + userTmp.username + ' again!';
		console.log(req.session.success);
		res.redirect('/index');
	});
});
```


```js
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
```


```js
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
```


```js
app.post('/', function (req, res) {
	var trynum = {};
    var info = req.body;
    var sessionUsername = req.session.user.username;
	if (sessionUsername) {
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
				dataUsername: sessionUsername
			});
			console.log("\n" + "*******************finish calculate!" + "\n");
		});
	} else {
		res.redirect('/logout');
	}
    
});
```

#### 对主事件循环的异常把整个node进程宕掉的处理

注册`uncaughtException`事件来捕捉异常：

```js
process.on('uncaughtException', function (err) {
	console.log(err);
});
```

### 2. pass.js

使用`pass.js`来作为验证身份的一个模块，加密保存至数据库里的用户名和密码，并且可以验证用户登录时输入的密码和数据库里的密码是否相同。

```js
var crypto = require('crypto');

var len = 128; 
var iterations = 12000;

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
```

### 3. calculate,js

调用 Matlab 子程序计算模块。完成前端数据传入至子程序 Matlab 中，获取得到计算结果后，提取出所需数据，反馈至前端页面的这一过程，最后结束子进程。

这里采用一个用户一次请求开一次子进程获得结果后结束子进程的原因是考虑到如下两个方面

 - js是异步单线程操作，如果大量用户并发请求就需要进入队列排队等候，不能充分利用CPU资源，故采用。
 - 每个用户自己的请求与所需返回的数据互不干扰。
 
```js
var spawn = require('child_process').spawn;

function getResult (matlabData, callback) {
	var dataObj = matlabData.split(/[^\d\.]+/);
	var result = [];
	var k = 0;
	for (var i = 0; i < dataObj.length; i++) {
		if (i == 0 || i == 1 || i == 2 || i == 10 || i == 11 || i == 17) {
			continue;
		} else {
			result[k] = dataObj[i];
			k ++;
		}
	}
	return callback(result);
};

exports.calculateResult = function (info, callback) {
	var matlabProcess = spawn('/Applications/MATLAB_R2014b.app/bin/matlab',['-nosplash','-nodesktop']);
	console.log(info);
	matlabProcess.stdin.write("calculate("+info.z0+","+info.f1+","+info.z1+","+info.j1+","+info.f2+","+info.z2+","+info.j2+","+info.f3+","+info.z3+","+info.j3+")"+ "\n");
	console.log("Start calculate----------------");
	matlabProcess.stderr.on('data', function (data) {
		console.log("err is: " + data);
		return callback(err)
	});
	matlabProcess.stdout.on('data', function (data) {
		var matlabData = '';
		matlabData = data.toString();
		console.log(matlabData);
		if (matlabData.indexOf("result") >= 0) {
			getResult(matlabData, function (result) {
				matlabProcess.kill();
				console.log("clear all and exports the result: ");
				callback(null, result);
			});
		}
	});
	matlabProcess.on('exit', function (code) {
		console.log('child_process exited with code: ' + code);
	});
}; 
```



