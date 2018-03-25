var mongoose=require('mongoose')
var productSchema=require('../schemas/product')

module.exports = mongoose.model('Product',productSchema)