var mongoose=require('mongoose')

// 用户的表结构
module.exports=new mongoose.Schema({
	//手机号
	tel:Number,
	//验证码
	vcode:String,
	//过期时间
	addtime:Date,
	// expireAfterSeconds:{
	// 	type:Number,
	// 	default:5
	// }
})





