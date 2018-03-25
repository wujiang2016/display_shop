var express=require('express')
var fs=require('fs')
var router=express.Router()
var User=require('../models/User')
// var Contents=require('../models/Contents')
var Brand=require('../models/Brand')//品牌
var Category=require('../models/Category')//分类
var Channel=require('../models/Channel')//渠道
var Product=require('../models/Product')//渠道
var Companyintro=require('../models/Companyintro')//
var Logoes=require('../models/Logoes')//
var exportExcel=require('./exportExcel')//

var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })



router.use(function(req,res,next) {
	if (!req.userInfo.isAdmin) {
		//如果是非管理员
		res.send('<script>alert("对不起，只有管理员才可进入后台管理");window.location.href="/";</script>')
		return
	}
	next()
})
//统一返回格式
var responseData;
router.use(function(req,res,next) {
	responseData={
		code:0,
		message:''
	}
	next();
})

router.get('/exportUser',function(req, res) {

 	var _headers=[
		{caption:'用户名',type:'string'},
		{caption:'身份证',type:'string'},
		{caption:'手机号',type:'string'}];
	User.find().then(function(uInfo) {
		var rows=[]
		if (uInfo&&uInfo.length) {
			uInfo.map(function(elem,index) {
				rows.push([elem.username,elem.ID,elem.tel])
			})
		}
		var result = exportExcel.exportExcel(_headers,rows);
	    // res.setHeader('Content-Type', 'application/vnd.openxmlformats');
	    // res.setHeader("Content-Disposition", "attachment; filename=" + "test.xlsx");
	    // fs.write()
	    fs.writeFile("./public/user.xlsx", result, 'binary', function (err) {
	        if (err){
		        responseData.message="数据导出失败"
				responseData.code=1
				res.json(responseData)
	        }
	        responseData.message="数据导出成功"
			responseData.data="/public/user.xlsx"
			res.json(responseData)
	    });
	})
})


//获取单个logo
router.post('/logo/get',function(req,res,next) {
	Logoes.find({_id:req.query._id}).then(function(contents) {
		responseData.message="数据查询成功"
		responseData.data=contents[0]
		res.json(responseData)
	})
})
//获取logo
router.post('/logo/getlist',function(req,res,next) {
	var start=Number(req.body.iDisplayStart||0)
	var length=Number(req.body.iDisplayLength || 1)
	var sEcho=Number(req.body.sEcho || 1)
	var currentPage=start/length+1//记录当前页码
	Logoes.find().count().then(function(count) {
		Logoes.find().limit(length).skip(start).sort({_id: -1}).then(function(contents) {
			var logoData=[]
			for (let i = 0; i < contents.length; i++) {
				logoData[i]={}
				logoData[i]._id=contents[i]._id
				logoData[i].partner=contents[i].partner
				logoData[i].desc=contents[i].desc||''
				logoData[i].picture=contents[i].picture
				
			}
			var resData={
				data:logoData,
				sEcho:sEcho,
				recordsFiltered : count,
				currentPage : currentPage,
				recordsTotal : count
			}
			res.json(resData)
		})
	})
})
//删除logo
router.post('/logo/del',function(req,res,next) {
	var _id=req.body._id;
	Logoes.remove({_id:{$in:_id}}, function (err, tank) {
	  if (err) {
		responseData.code=1;
		responseData.message='数据查询出错';
		res.json(responseData)
		return;
	  }
	  responseData.message="logo删除成功"
	  res.json(responseData);
	})
})
router.post('/logo/add',upload.single('picture'),function(req,res,next) {
	var obj={
		partner:req.body.partner,
		desc:req.body.desc,
	}
	if (req.file&&req.file.filename) {
		obj.picture='/uploads/'+req.file.filename
	}
	if (req.body._id) {
		Logoes.update({_id:req.body._id},{$set:obj}).then(function(cInfo) {
			if (cInfo.nModified) {
				responseData.message="数据更新成功！"
			} else {
				responseData.code=1;
				responseData.message='未查询到要修改的数据！';
			}
			res.send(responseData);
		})
	} else {
		new Logoes(obj).save().then(function(pInfo) {
			responseData.message="logo添加成功！"
			responseData.data=pInfo
			res.json(responseData)
		})
	}
})









//批量变更产品新品状态
router.post('/product/changeNewer',function(req,res,next) {
	console.log(req.body._ids);
	console.log(req.body.isNewer);
	Product.updateMany({_id:{$in:req.body._ids}},{$set:{newer:req.body.isNewer}}).then(function(cInfo) {
		console.log(cInfo);
		if (cInfo.nModified) {
			responseData.message="产品新品状态更新成功！"
		} else {
			responseData.code=1;
			responseData.message='未查询到要修改的数据！';
		}
		res.send(responseData);
	})
})
//批量变更产品分类
router.post('/product/changeCategory',function(req,res,next) {
	console.log(req.body._ids);
	console.log(req.body.category);
	Product.updateMany({_id:{$in:req.body._ids}},{$set:{category:req.body.category}}).then(function(cInfo) {
		console.log(cInfo);
		if (cInfo.nModified) {
			responseData.message="产品分类更新成功！"
		} else {
			responseData.code=1;
			responseData.message='未查询到要修改的数据！';
		}
		res.send(responseData);
	})
})
//获取单个产品
router.post('/product/get',function(req,res,next) {
	Product.find({_id:req.query._id}).then(function(contents) {
		responseData.message="数据查询成功"
		responseData.data=contents[0]
		res.json(responseData)
	})
})
//获取产品
router.post('/product/getlist',function(req,res,next) {
	var productname=req.body.productname
	var categoryIds=req.body.categoryIds
	if (categoryIds) {
		categoryIds=categoryIds.split(',')
	}
	var category_ids=[];//分类的_id
	new Promise(function(resolve,reject) {
		if (categoryIds) {
			Category.find({id:{$in:categoryIds}}).then(function(cInfo) {
				cInfo.map(function(elem,index) {
					category_ids.push(elem._id)
				})
				resolve(category_ids)
			})
		}else{
			resolve(category_ids)
		}
	}).then(function(content) {
		var condition={}
		if (productname) {
			var reg=eval('/'+productname+'/')
			var tmp={$regex:reg}
			condition.productname=tmp
		}
		if (category_ids.length) {
			condition.category={$in:category_ids}
		}
		var start=Number(req.body.iDisplayStart||0)
		var length=Number(req.body.iDisplayLength || 1)
		var sEcho=Number(req.body.sEcho || 1)
		var currentPage=start/length+1//记录当前页码
		Product.find(condition).count().then(function(count) {
			Product.find(condition).limit(length).skip(start).sort({newer:-1,_id: -1}).populate([{path: 'category', select: 'categoryname -_id'}, {path: 'brand', select: 'brandname -_id'}, {path: 'channel', select: 'channelname -_id'}]).then(function(contents) {
				var productData=[]
				for (let i = 0; i < contents.length; i++) {
					var tmpStr=''
					contents[i].species.map(function(elem,index) {
						tmpStr+=elem.speci+'，￥'+elem.price_low+'~'+elem.price_high+'；'
					})
					productData[i]={}
					productData[i]._id=contents[i]._id
					productData[i].productname=contents[i].productname
					productData[i].desc=contents[i].desc||''
					productData[i].picture=contents[i].picture
					productData[i].category=contents[i].category&&contents[i].category.categoryname||''
					productData[i].brand=contents[i].brand&&contents[i].brand.brandname||''
					productData[i].channel=contents[i].channel.channelname
					productData[i].shelf=contents[i].shelf
					productData[i].newer=contents[i].newer
					productData[i].species=tmpStr
				}
				var resData={
					data:productData,
					sEcho:sEcho,
					recordsFiltered : count,
					currentPage : currentPage,
					recordsTotal : count
				}
				res.json(resData)
			})
		})
	})
})
//删除产品
router.post('/product/del',function(req,res,next) {
	var _id=req.body._id;
	Product.remove({_id:{$in:_id}}, function (err, tank) {
	  if (err) {
		responseData.code=1;
		responseData.message='数据查询出错';
		res.json(responseData)
		return;
	  }
	  responseData.message="产品删除成功"
	  res.json(responseData);
	})
})
//编辑产品
router.post('/product/edit',function(req,res,next) {
	var _id=req.body._id;
	var shelfStatus=req.body.shelfStatus;
	if (shelfStatus) {
		shelfStatus=('true'==shelfStatus)?true:false;
		Product.update({_id:_id},{$set:{shelf:shelfStatus}}).then(function(cInfo) {
			if (cInfo.nModified) {
				responseData.message="产品"+(shelfStatus?'上':'下')+"架成功！"
			} else {
				responseData.code=1;
				responseData.message='未查询到要修改的数据！';
			}
			res.send(responseData);
		})
	} else {

	}
		// res.send(responseData);
		return
	var productname=req.body.productname;
	var id=req.body.id;
	Product.update({id:id},{$set:{productname:productname}}).then(function(cInfo) {
		if (cInfo.nModified) {
			responseData.message="产品修改成功！"
		} else {
			responseData.code=1;
			responseData.message='未查询到要修改的数据！';
		}
		res.send(responseData);
	})
})
router.post('/product/add',upload.single('picture'),function(req,res,next) {
	var species=[]
	for (var i = 0; i < req.body.speci.length; i++) {
		var tmp={}
		tmp.speci=req.body.speci[i]
		tmp.price_low=req.body.price_low[i]
		tmp.price_high=req.body.price_high[i]
		species.push(tmp)
	}
	var obj={
		productname:req.body.productname,
		desc:req.body.desc,
		category:req.body.category,
		brand:req.body.brand,
		channel:req.body.channel,
		shelf:req.body.shelf&&true||false,
		newer:req.body.newer&&1||0,
		species:species,
	}
	if (req.file&&req.file.filename) {
		obj.picture='/uploads/'+req.file.filename
	}
	if (req.body._id) {
		Product.update({_id:req.body._id},{$set:obj}).then(function(cInfo) {
			if (cInfo.nModified) {
				responseData.message="数据更新成功！"
			} else {
				responseData.code=1;
				responseData.message='未查询到要修改的数据！';
			}
			res.send(responseData);
		})
	} else {
		new Product(obj).save().then(function(pInfo) {
			responseData.message="产品添加成功！"
			responseData.data=pInfo
			res.json(responseData)
		})
	}
})

//获取渠道
router.get('/channel/get',function(req,res,next) {
	Channel.find().then(function(cInfo) {
		if (cInfo) {
			responseData.message='数据查询成功';
			responseData.data=cInfo;
		} else {
			responseData.code=1;
			responseData.message='未查到数据';
		}
		res.json(responseData)
	})
})
//删除渠道
router.post('/channel/del',function(req,res,next) {
	var delId=req.body.delId;
	// 删除分类时，把该分类下的产品转到其它名下
	Channel.find({id:delId}).then(function(cInfo) {
		var tmpIds=[]
		cInfo.map(function(elem,index) {
			tmpIds.push(elem._id)
		})
		return tmpIds
	}).then(function(tmpIds) {
		Channel.find({channelname:'其它'}).limit(1).then(function(cInfo) {
			if (cInfo[0]) {
				Product.updateMany({ channel:{$in:tmpIds}}, { $set: { channel: cInfo[0]._id }}).then(function(info) {});
			} else {
				// 新建其它分类
				new Channel({channelname:'其它',id:-1}).save().then(function(cInfo) {
					Product.updateMany({ channel:{$in:tmpIds}}, { $set: { channel: cInfo._id }}).then(function(info) {});
				})
			}
		})
	})
	Channel.remove({id:delId}, function (err, tank) {
	  if (err) {
		responseData.code=1;
		responseData.message='数据查询出错';
		res.json(responseData)
		return;
	  }
	  responseData.message="渠道删除成功"
	  res.json(responseData);
	})
})
//编辑渠道
router.post('/channel/edit',function(req,res,next) {
	var channelname=req.body.channelname;
	var id=req.body.id;
	Channel.update({id:id},{$set:{channelname:channelname}}).then(function(cInfo) {
		if (cInfo.nModified) {
			responseData.message="渠道修改成功！"
		} else {
			responseData.code=1;
			responseData.message='未查询到要修改的数据！';
		}
		res.send(responseData);
	})
})
//添加新渠道
router.post('/channel/add',function(req,res,next) {
	var channelname=req.body.channelname;
	// 验证用户名是否已被注册
	Channel.findOne({
		channelname:channelname
	}).then(function(channelInfo) {
		if (channelInfo) {
			responseData.code=1;
			responseData.message='渠道已经存在';
			res.json(responseData)
			return;
		}
		return Channel.find().sort({id:-1}).limit(1).then(function(cInfo) {
			if (cInfo&&cInfo[0]) {
				id=Number(cInfo[0].id||0)+1
			} else {
				id=1
			}
			var channel=new Channel({
				channelname:channelname,
				id:id
			})
			return channel.save()
		})
	}).then(function(channelInfo) {
		responseData.message='渠道添加成功'
		responseData.data=channelInfo
		res.json(responseData)
	})
})
//获取分类
router.get('/category/get',function(req,res,next) {
	var condition={}
	if('undefined'!=typeof req.query.isParent){
		condition={isParent:req.query.isParent}
	}
	Category.find(condition).then(function(cInfo) {
		if (cInfo) {
			responseData.message='数据查询成功';
			responseData.data=cInfo;
		} else {
			responseData.code=1;
			responseData.message='未查到数据';
		}
		res.json(responseData)
	})
})
//删除分类
router.post('/category/del',function(req,res,next) {
	var delIds=req.body.delIds;
	var pid=req.body.pid;
	var pChildLen=req.body.pChildLen;
	if (pChildLen<=1) {
		Category.update({id:pid},{$set:{isParent:false}}).then(function(cInfo) {
		})
	}
	// 删除分类时，把该分类下的产品转到其它名下
	Category.find({id:{$in:delIds}}).then(function(cInfo) {
		var tmpIds=[]
		cInfo.map(function(elem,index) {
			tmpIds.push(elem._id)
		})
		return tmpIds
	}).then(function(tmpIds) {
		Category.find({categoryname:'其它'}).limit(1).then(function(cInfo) {
			if (cInfo[0]) {
				Product.updateMany({ category:{$in:tmpIds}}, { $set: { category: cInfo[0]._id }}).then(function(info) {});
			} else {
				// 新建其它分类
				new Category({categoryname:'其它',id:-1,pid:0}).save().then(function(cInfo) {
					Product.updateMany({ category:{$in:tmpIds}}, { $set: { category: cInfo._id }}).then(function(info) {});
				})
			}
		})
	})
	// 删除分类		
	Category.remove({id:{$in:delIds}}, function (err, tank) {
	  if (err) {
		responseData.code=1;
		responseData.message='数据查询出错';
		res.json(responseData)
		return;
	  }
	  responseData.message="分类删除成功"
	  res.json(responseData);
	})
})
//编辑分类
router.post('/category/edit',function(req,res,next) {
	var categoryname=req.body.categoryname;
	var id=req.body.id;
	Category.update({id:id},{$set:{categoryname:categoryname}}).then(function(cInfo) {
		if (cInfo.nModified) {
			responseData.message="分类修改成功！"
		} else {
			responseData.code=1;
			responseData.message='未查询到要修改的数据！';
		}
		res.send(responseData);
	})
})
//添加新分类
router.post('/category/add',function(req,res,next) {
	var categoryname=req.body.categoryname;
	var id=req.body.id||'';
	var pid=req.body.pid;
	Category.update({id:pid},{$set:{isParent:true}}).then(function(cInfo) {
	})
	// 验证用户名是否已被注册
	Category.findOne({
		categoryname:categoryname
	}).then(function(categoryInfo) {
		if (categoryInfo) {
			responseData.code=1;
			responseData.message='分类已经存在';
			res.json(responseData)
			return;
		}
		if (''===id) {
			return Category.find().sort({id:-1}).limit(1).then(function(cInfo) {
				if (cInfo&&cInfo[0]) {
					id=Number(cInfo[0].id||0)+1
				} else {
					id=1
				}
				var category=new Category({
					categoryname:categoryname,
					id:id,
					pid:pid
				})
				return category.save()
			})
		}else{
			var category=new Category({
				categoryname:categoryname,
				id:id,
				pid:pid
			})
			return category.save()
		}
	}).then(function(categoryInfo) {

		responseData.message='分类添加成功'
		responseData.data=categoryInfo
		res.json(responseData)
	})
})

//获取全部品牌
router.post('/brand/get',function(req,res,next) {
	Brand.find().sort({_id:-1}).then(function(bInfo) {
		if (bInfo) {
			responseData.message='数据查询成功';
			responseData.data=bInfo;
		} else {
			responseData.code=1;
			responseData.message='未查到数据';
		}
		res.json(responseData)
	})
})
//获取品牌
router.post('/brand/getlist',function(req,res,next) {
	var start=Number(req.body.iDisplayStart)
	var length=Number(req.body.iDisplayLength || 1)
	var sEcho=Number(req.body.sEcho || 1)
	var currentPage=start/length+1
	Brand.count().then(function(count) {
		Brand.find().limit(length).skip(start).sort({_id: -1}).then(function(contents) {
			var brandData=[]
			for (let i = 0; i < contents.length; i++) {
				brandData[i]={}
				brandData[i]._id=contents[i]._id
				brandData[i].brandname=contents[i].brandname
				brandData[i].desc=contents[i].desc||''
			}
			var resData={
				data:brandData,
				sEcho:sEcho,
				recordsFiltered : count,
				currentPage : currentPage,
				recordsTotal : count
			}
			res.json(resData)
		})
	})
})
//删除品牌
router.post('/brand/del',function(req,res,next) {
	var brandid=req.body.brandid;
	Brand.remove({_id:{$in:brandid}}, function (err, tank) {
	  if (err) {
		responseData.code=1;
		responseData.message='数据查询出错';
		res.json(responseData)
		return;
	  }
	  responseData.message="品牌删除成功"
	  res.send(responseData);
	})
})
//编辑品牌
router.post('/brand/edit',function(req,res,next) {
	var brandname=req.body.brandname;
	var brandid=req.body.brandid;
	var branddesc=req.body.branddesc;
	Brand.findOne({
		brandname:brandname,
		_id:{$nin:[brandid]}
	}).then(function(brandInfo) {
		if (brandInfo) {
			responseData.code=1;
			responseData.message='品牌名称存在';
			res.json(responseData)
			return;
		}
		Brand.findByIdAndUpdate(brandid, {$set: {brandname:brandname,desc:branddesc}}, { new: true }, function (err, tank) {
		  if (err) {
			responseData.code=2;
			responseData.message='数据查询出错';
			res.json(responseData)
			return;
		  }
		  responseData.message="品牌修改成功"
		  res.send(responseData);
		});
	})
})
//添加新品牌
router.post('/brand/add',function(req,res,next) {
	var brandname=req.body.brandname;
	// 验证用户名是否已被注册
	Brand.findOne({
		brandname:brandname
	}).then(function(brandInfo) {
		if (brandInfo) {
			responseData.code=1;
			responseData.message='品牌已经存在';
			res.json(responseData)
			return;
		}
		var brand=new Brand({
			brandname:brandname,
		})
		return brand.save()
	}).then(function(brandInfo) {
		responseData.message='品牌添加成功'
		res.json(responseData)
	})
})
router.get('/',function(req,res,next) {
	res.render('admin/index')
})
// router.get('/user',function(req,res) {
// 	//分页获取数据
// 	// limit(number)限制获取的条数
// 	// skip(2)忽略数据的条数
// 	var page=Number(req.query.page || 1)
// 	var limit=2
// 	User.count().then(function(count) {
// 		pages=Math.ceil(count/limit)
// 		page=Math.min(page,pages)
// 		page=Math.max(page,1)
// 		var skip=(page-1)*limit

// 		User.find().limit(limit).skip(skip).then(function(users) {
// 			res.render('admin/user_index',{
// 				userInfo:req.userInfo,
// 				users:users
// 			})
// 		})
// 	})
// })


//获取全部用户
router.post('/user/get',function(req,res,next) {
	User.find().sort({_id:-1}).then(function(bInfo) {
		if (bInfo) {
			responseData.message='数据查询成功';
			responseData.data=bInfo;
		} else {
			responseData.code=1;
			responseData.message='未查到数据';
		}
		res.json(responseData)
	})
})
//获取用户
router.post('/user/getlist',function(req,res,next) {
	var start=Number(req.body.iDisplayStart)
	var length=Number(req.body.iDisplayLength || 1)
	var sEcho=Number(req.body.sEcho || 1)
	var currentPage=start/length+1
	var usertel=req.body.usertel
	var condition={}
	if (usertel) {
		var reg=eval('/'+usertel.toString()+'/')
		var tmp={$regex:reg}
		condition.tel=tmp
	}
	User.count(condition).then(function(count) {
		User.find(condition).limit(length).skip(start).sort({_id: -1}).then(function(contents) {
			var userData=[]
			for (let i = 0; i < contents.length; i++) {
				userData[i]={}
				userData[i]._id=contents[i]._id
				userData[i].tel=contents[i].tel
				userData[i].isAdmin=contents[i].isAdmin
			}
			var resData={
				data:userData,
				sEcho:sEcho,
				recordsFiltered : count,
				currentPage : currentPage,
				recordsTotal : count
			}
			res.json(resData)
		})
	})
})
//删除用户
router.post('/user/del',function(req,res,next) {
	var userid=req.body.userid;
	User.remove({_id:{$in:userid}}, function (err, tank) {
	  if (err) {
		responseData.code=1;
		responseData.message='数据查询出错';
		res.json(responseData)
		return;
	  }
	  responseData.message="用户删除成功"
	  res.send(responseData);
	})
})
//编辑用户
router.post('/user/edit',function(req,res,next) {
	// var usertel=req.body.usertel;
	var _id=req.body.userid;
	var isAdmin=req.body.isAdmin;
	User.findByIdAndUpdate(_id, {$set: {isAdmin:isAdmin}}, { new: true }, function (err, tank) {
	  if (err) {
		responseData.code=1;
		responseData.message='数据查询出错';
		res.json(responseData)
		return;
	  }
	  responseData.message="用户修改成功"
	  responseData.data=isAdmin
	  res.send(responseData);
	});
})
//添加新用户
router.post('/user/add',function(req,res,next) {
	var username=req.body.username;
	// 验证用户名是否已被注册
	User.findOne({
		username:username
	}).then(function(userInfo) {
		if (userInfo) {
			responseData.code=1;
			responseData.message='用户已经存在';
			res.json(responseData)
			return;
		}
		var user=new User({
			username:username,
		})
		return user.save()
	}).then(function(userInfo) {
		responseData.message='用户添加成功'
		res.json(responseData)
	})
})
router.post('/account',function(req,res,next) {
	var tel=req.userInfo.tel.toString()
	tel=tel.slice(0, 3)+'****'+tel.slice(7)
	responseData.data=tel
	res.json(responseData)
})
router.post('/companyintro',function(req,res,next) {
	Companyintro.find().limit(1).then(function(cInfo) {
		if (cInfo&&cInfo[0]) {
			Companyintro.findByIdAndUpdate(cInfo[0]._id, {$set: {title:req.body.title,content:req.body.content}}, { new: true }, function (err, tank) {
			  if (err) {
				responseData.code=1;
				responseData.message='数据更新出错';
				res.json(responseData)
				return;
			  }
			  responseData.message="数据更新成功！"
			  res.send(responseData);
			});
		} else {
			new Companyintro({title:req.body.title,content:req.body.content}).save().then(function(sInfo) {
				responseData.message='数据更新成功！'
				res.json(responseData)
			})
		}
	})
})


// router.get('/content',function(req,res) {
// 	//分页获取数据
// 	// limit(number)限制获取的条数
// 	// skip(2)忽略数据的条数
// 	var page=Number(req.query.page || 1)
// 	var limit=2
// 	Contents.count().then(function(count) {
// 		pages=Math.ceil(count/limit)
// 		page=Math.min(page,pages)
// 		page=Math.max(page,1)
// 		var skip=(page-1)*limit

// 		Contents.find().limit(limit).skip(skip).populate('category').then(function(contents) {
// 			res.render('admin/content_index',{
// 				contentInfo:req.contentInfo,
// 				contents:contents
// 			})
// 		})
// 	})
// })

module.exports=router
