var mongoose=require('mongoose')
var brandSchema=require('../schemas/brand')

module.exports = mongoose.model('Brand',brandSchema)