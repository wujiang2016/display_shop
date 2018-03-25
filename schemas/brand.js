var mongoose=require('mongoose')

// 用户的表结构
module.exports=new mongoose.Schema({
	//品牌名称
	brandname:String,
	//具体描述
	desc:{
		type:String,
		default:''
	}
})
