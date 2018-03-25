var express=require('express')
var router=express.Router()
var User=require('../models/User')//引入模型类操作数据库
var Captcha=require('../models/Captcha')//引入模型类操作数据库
var crypto = require('crypto');
var http=require("http");
var querystring = require("querystring");
var MessageSend = require('./messageSend');
var message = new MessageSend();

function cryptPwd(password, salt) {
    // 密码“加盐”
    var saltPassword = password + ':' + salt;
    // 加盐密码的md5值
    var md5 = crypto.createHash('md5');
    return md5.update(saltPassword).digest('hex');
}
//统一返回格式
var responseData;
router.use(function(req,res,next) {
	responseData={
		code:0,
		message:''
	}
	next();
})
//用户重置密码
router.post('/reset',function(req,res,next) {
	var tel=req.body.mobile.toString();
	var password=cryptPwd(req.body.password, 'wydwb');//密码加盐加密
	var vcode=req.body.verifyCode;
	Captcha.findOne({
		tel:tel,
		vcode:vcode
	}).then(function(content) {
		if (content) {
			//记录手机验证码，有效期5分钟
			if (((new Date()).valueOf()-(new Date(content.addtime)).valueOf())>300000) {
				responseData.code=2
				responseData.message='验证码过期'
				res.json(responseData)
			}
		} else {
			responseData.code=1
			responseData.message='验证码不正确'
			res.json(responseData)
		}

		// 验证用户名是否已被注册
		User.update({tel:tel},{$set:{password:password}}).then(function(uInfo) {
			if (uInfo.nModified||uInfo.ok) {
				responseData.message="密码重置成功！"
			} else {
				responseData.code=3;
				responseData.message='未查询到要修改的数据！';
			}
			res.send(responseData);
		})
	})
})

//用户注册
router.post('/register',function(req,res,next) {
	var username=req.body.username.toString();
	var ID=req.body.ID.toString();
	var tel=req.body.mobile.toString();
	var password=cryptPwd(req.body.password, 'wydwb');//密码加盐加密
	var vcode=req.body.verifyCode;
	Captcha.findOne({
		tel:tel,
		vcode:vcode
	}).then(function(content) {
		if (content) {
			//记录手机验证码，有效期5分钟
			if (((new Date()).valueOf()-(new Date(content.addtime)).valueOf())>300000) {
				responseData.code=2
				responseData.message='验证码过期'
				res.json(responseData)
			}
		} else {
			responseData.code=1
			responseData.message='验证码不正确'
			res.json(responseData)
		}
	})
	// 验证用户名是否已被注册
	User.findOne({
		tel:tel
	}).then(function(userInfo) {
		if (userInfo) {
			responseData.code=3;
			responseData.message='手机号已经被注册了';
			res.json(responseData)
			return;
		}
		var user=new User({
			username:username,
			ID:ID,
			tel:tel,
			password:password
		})
		return user.save()
	}).then(function(userInfo) {
		//注册后设置cookie信息，注册成功直接跳转
		req.cookies.set('userInfo',JSON.stringify({
			_id:userInfo._id,
			username:new Buffer(userInfo.username).toString('base64'),
			tel:userInfo.tel
		}))
		responseData.message='注册成功'
		res.json(responseData)
	})
})

//登录
router.post('/login',function(req,res) {
	var resData={
		"actionMessages":[],
		"actionErrors":["账号密码错误"],
		"fieldErrors":{},
		"data":{},
		"hasFieldErrors":false,
		"hasActionErrors":true,
		"hasErrors":true,
		"hasActionMessages":false
	}
	resData.data.redirect=req.body.redirect
	

	var tel=req.body.tel
	var password=cryptPwd(req.body.password, 'wydwb');//密码加盐加密
	var rememberMe=req.body.rememberMe

	if ((tel=='')||(password=='')) {
		res.json(resData)
	}
	//查询是否有记录
	User.findOne({
		tel:tel,
		password:password
	}).then(function(userInfo) {
		if (!userInfo) {
			res.json(resData)
			return;
		}
		resData.actionMessages=['登录成功']
		resData.actionErrors=[]
		resData.hasActionErrors=false
		resData.hasErrors=false
		resData.hasActionMessages=true
		req.cookies.set('userInfo',JSON.stringify({
			_id:userInfo._id,
			username:new Buffer(userInfo.username).toString('base64'),
			tel:userInfo.tel
		}))
		res.json(resData)
		return;
	})
})
//退出
router.get('/logout',function(req,res) {
	req.cookies.set('userInfo',null)
	res.json(responseData)
})
//评论提交
// router.post('/comment/post',function(req,res) {
// 	//内容的id
// 	var contentId=req.body.contentid || ''
// 	var postData={
// 		username:req.userInfo.username,
// 		postTime:new Date(),
// 		content:req.body.content
// 	}
// 	//查询当前这篇内容的信息
// 	Content.findOne({
// 		_id:contentId
// 	}).then(function(content) {
// 		content.comment.push(postData)
// 		return content.save()
// 	}).then(function(newContent) {
// 		responseData.message='评论成功'
// 		res.json(responseData)
// 	})
// })
function getCaptcha() {//生成6位数字验证码
	var n='';
	for (var i = 0; i < 6; i++) {
		n+=Math.floor(Math.random()*10).toString()[0]
	}
	return n;
}
router.post('/registerCode',function(req,res,next) {
			var mobile=req.body.mobile
			var vcode=getCaptcha()
	Captcha.findOne({
		tel:mobile
	}).then(function(content) {
		if (content) {
			//记录手机验证码，有效期1分钟
			if (((new Date()).valueOf()-(new Date(content.addtime)).valueOf())<6000) {
				responseData.code='1'
				responseData.message='请勿频繁发送验证码'
				res.json(responseData)
			}else{
				content.vcode=vcode
				content.addtime=new Date()
				return content.save()
			}
		} else {
			var captcha=new Captcha({
				tel:mobile,
				vcode:vcode,
				addtime:new Date()
			})

			return captcha.save()
		}
	}).then(function(newContent) {
		message.set_to(mobile);
		message.set_content('【灏行商城】您的验证码是'+vcode+'，五分钟内有效，如非本人操作请忽略。');
		message.set_tag('灏行科技');

		message.send();

		responseData.message='验证码发送成功'
		responseData.data=newContent
		res.json(responseData)
	})
})
module.exports=router;


