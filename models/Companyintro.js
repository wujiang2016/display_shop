var mongoose=require('mongoose')
var companyintroSchema=require('../schemas/companyintro')

module.exports = mongoose.model('Companyintro',companyintroSchema)