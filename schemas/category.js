var mongoose=require('mongoose')

// 用户的表结构
module.exports=new mongoose.Schema({
	id:Number,//自身节点id
	pid:Number,//父节点id
	//分类名称
	categoryname:String,
	//是否是父节点
	isParent:{
		type:Boolean,
		default:false
	}
})
