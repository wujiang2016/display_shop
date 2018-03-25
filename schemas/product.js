var mongoose=require('mongoose')

// 用户的表结构
module.exports=new mongoose.Schema({
	//关联字段 - 分类的id
	//内容标题
	productname:String,//产品名称
	desc:String,//产品描述
	picture:String,//产品图片
	//分类
	category:{
		type:mongoose.Schema.Types.ObjectId,//类型 
		ref:'Category'//引用 
	},
	//品牌
	brand:{
		type:mongoose.Schema.Types.ObjectId,//类型 
		ref:'Brand'//引用 
	},
	//渠道
	channel:{
		type:mongoose.Schema.Types.ObjectId,//类型 
		ref:'Channel'//引用 
	},
	//规格和价格
	// speci:{type:Array, default:[] },
	species:[{speci:String,price_low:Number,price_high:Number}],
	//是否上架
	shelf:{
		type:Boolean,
		default:true
	},
	//是否新品
	newer:{
		type:Number,
		default:0
	}
})
