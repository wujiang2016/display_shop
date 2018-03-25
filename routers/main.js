var express=require('express')
var Cookies=require('cookies')
var router=express.Router()
var Brand=require('../models/Brand')//品牌
var Category=require('../models/Category')//分类
var Channel=require('../models/Channel')//渠道
var Product=require('../models/Product')//渠道
var Companyintro=require('../models/Companyintro')//渠道
var Logoes=require('../models/Logoes')//

var logoes=[]
router.use(function(req,res,next) {
	Logoes.find().sort({_id: -1}).then(function(contents) {
		logoes=contents
		next()
	})
})

router.get('/',function(req,res,next) {
	var brandInfo=[]
	var categoryInfo=[]
	var channelInfo=[]
	var productInfo=[]
	var n=0
	Brand.find().sort({_id:-1}).then(function(bInfo) {
		if (bInfo) {
			brandInfo=bInfo;
		}
		n++
	})
	Category.find({id:{$gt:-1},isParent:false}).then(function(cInfo) {
		if (cInfo) {
			categoryInfo=cInfo;
		}
		n++
	})
	Channel.find({id:{$gt:-1}}).then(function(CInfo) {
		if (CInfo) {
			channelInfo=CInfo;
		}
		n++
	})

	var totalcount=0
	var limit=50
	Product.find({shelf:true}).count().then(function(count) {
		totalcount=count
		Product.find({shelf:true}).sort({newer:-1,_id:-1}).limit(limit).then(function(pInfo) {
			if (pInfo) {
				productInfo=pInfo;
			}
			n++
		})
	})
		
	var tel;
	var username;
	if (req.userInfo.tel) {
		tel=req.userInfo.tel.toString()
		username=new Buffer(req.userInfo.username, 'base64').toString()
		tel=tel.slice(0, 3)+'****'+tel.slice(7)
	}
	var timer=setInterval(()=>{
		if (n>=4) {
			clearInterval(timer);
			res.render('main/index',{
				navFlag:true,
				tel:tel,
				username:username,
				logoes:logoes,
				admin:req.userInfo.isAdmin,
				totalPage:Math.ceil(totalcount/limit),
				brandInfo:brandInfo,
				categoryInfo:categoryInfo,
				channelInfo:channelInfo,
				productInfo:productInfo
			})
		}
	}, 10);		
})
router.post('/search',function(req,res,next) {
	var n=0
	var sKeywords=req.body.sKeywords
	var sBrandId=req.body.sBrandId

	var sCategoryId=req.body.sCategoryId
	var sChannelIds=req.body.sChannelIds
	var priceOrder=req.body.priceOrder

	var lowPrice=parseInt(req.body.lowPrice)
	var highPrice=parseInt(req.body.highPrice)
	var curPage=req.body.curPage

	var brandCondition={}
	var productCondition={shelf:true}
	var sortCondition={_id:-1}
	if (!sKeywords&&!sBrandId&&!sCategoryId&&!sChannelIds&&!parseInt(priceOrder)&&!lowPrice&&!highPrice) {
		sortCondition={newer:-1,_id:-1}
	}
	if (sBrandId) {
		productCondition.brand=sBrandId
	}
	if (sCategoryId) {
		productCondition.category=sCategoryId
	}
	if (sChannelIds) {
		productCondition.channel={$in:sChannelIds}
	}
	if (1==priceOrder) {
		sortCondition={'species.0.price_low':1,_id:-1}
	} else if (-1==priceOrder){
		sortCondition={'species.0.price_low':-1,_id:-1}
	}
	if (lowPrice) {
		productCondition = Object.assign(productCondition, {'species.0.price_low':{$gte:lowPrice}})
	}
	if (highPrice) {
		productCondition = Object.assign(productCondition, {'species.0.price_high':{$lte:highPrice}})
	}
	var limit=parseInt(req.body.limit)
	var skip=(curPage-1)*limit

	if (sKeywords&&sKeywords.length&&!sBrandId) {
		var tmp='['
		sKeywords.map(function(elem,index) {
			tmp+='('+elem+')'
		})
		tmp+=']'
		var reg=eval('/'+tmp+'/')
		var tmp={$regex:reg}
		
		brandCondition.brandname=tmp
		productCondition.productname=tmp
		Brand.find(brandCondition).then(function(bInfo) {
			if (bInfo) {
				var tmp=[]
				bInfo.map(function(elem,index) {
					tmp.push(elem._id)
				})
				if (tmp.length) {
					productCondition.brand={$in:tmp}
				}
			}
			n++;
		})
	}else{
		n++;
	}
	var timer=setInterval(()=>{
		if (n>=1) {
			clearInterval(timer);
			Product.find(productCondition).count().then(function(count) {
				Product.find(productCondition).sort(sortCondition).skip(skip).limit(limit).then(function(contents) {
					// var brandData=[]
					// for (let i = 0; i < contents.length; i++) {
					// 	brandData[i]={}
					// 	brandData[i]._id=contents[i]._id
					// 	brandData[i].brandname=contents[i].brandname
					// 	brandData[i].desc=contents[i].desc||''
					// }

					var tel;
					if (req.userInfo.tel) {
						tel=req.userInfo.tel.toString()
						tel=tel.slice(0, 3)+'****'+tel.slice(7)
					}
					var resData={
						data:contents,
						count:count,
						tel:tel
					}
					res.json(resData)
				})
			})
				
		}
	}, 2);
})




router.get('/intro',function(req,res,next) {
	Companyintro.find().limit(1).then(function(cInfo) {
		var title='',content=''
		if (cInfo&&cInfo[0]) {
			title=cInfo[0].title
			content=cInfo[0].content
		} 
		res.render('main/intro',{title:title,content:content,logoes:logoes})
	})
	// res.send('注册')
})
router.get('/register',function(req,res,next) {
	// res.send('注册')
	res.render('main/register',{logoes:logoes})
})
router.get('/login',function(req,res,next) {
	// res.send('登陆')
	res.render('main/login',{logoes:logoes})
})
router.get('/reset',function(req,res,next) {
	// res.send('重置密码')
	res.render('main/reset',{logoes:logoes})
})

module.exports=router
