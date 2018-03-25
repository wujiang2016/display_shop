//应用程序的启动入口文件
//加载express模块
var express=require('express')
//加载模板处理模块
var swig=require('swig')
//加载数据块模块
var mongoose=require('mongoose')
//加载body-parser,用来处理post提交过来的数据
var bodyParser=require('body-parser')
//加载cookies模块
var Cookies=require('cookies')
// 创建app应用
var app=express()

var User=require('./models/User')
// 设置静态文件托管
app.use('/public',express.static(__dirname+'/public'))
app.use('/uploads',express.static(__dirname+'/uploads'))
app.use('/static',express.static(__dirname+'/views/admin/static'))
app.use('/lib',express.static(__dirname+'/views/admin/lib'))
// app.use('/admin',express.static(__dirname+'/views/admin'))
//定义模板引擎，使用swig.renderFile方法解析后缀为html的文件
app.engine('html',swig.renderFile)
app.set('views','./views')
app.set('view engine','html')
swig.setDefaults({cache:false})

//bodyParser设置
app.use(bodyParser.urlencoded({extended:true}))
//设置cookie
app.use(function(req,res,next) {
	req.cookies=new Cookies(req,res)
	req.userInfo={}
	if (req.cookies.get('userInfo')) {
		try{
			req.userInfo=JSON.parse(req.cookies.get('userInfo'))
			//获取当前登录用户的类型，是否是管理员
			User.findById(req.userInfo._id).then(function(userInfo) {
				req.userInfo.isAdmin=Boolean(userInfo.isAdmin)
				// req.userInfo.isAdmin=true
				if (req.userInfo.isAdmin) {
					app.use('/admin',express.static(__dirname+'/views/admin'))
				}
				app.get('*', function(req, res){
					console.log(req.url);
					res.send('<script>alert("非法路径！");window.location.href="/";</script>')
				});
				next()
			})
		}catch(e){
			next()
		}
	}else{
		next()
	}
	
})

app.use('/admin',require('./routers/admin'))
app.use('/api',require('./routers/api'))
app.use('/',require('./routers/main'))
//处理非法路径

//监听http请求
mongoose.connect('mongodb://localhost:27017/blog',function(err) {
	if (err) {
		console.log('数据库连接失败');
	} else {
		console.log('数据库连接成功');
		app.listen(8081)
		console.log('127.0.0.1:8081');
	}
})
