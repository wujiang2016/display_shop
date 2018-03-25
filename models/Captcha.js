var mongoose=require('mongoose')
var captchaSchema=require('../schemas/captcha')

module.exports = mongoose.model('Captcha',captchaSchema)