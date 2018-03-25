var mongoose=require('mongoose')
var logoesSchema=require('../schemas/logoes')

module.exports = mongoose.model('Logoes',logoesSchema)