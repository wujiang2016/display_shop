// companyintro
var mongoose=require('mongoose')

// 用户的表结构
module.exports=new mongoose.Schema({
	// //简介标题
	// title:String,
	// //简介描述
	// desc:{
	// 	type:String,
	// 	default:''
	// },
	picture:String,//logo图片
	partner:String,//
	desc:String,//
})