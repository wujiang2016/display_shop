var mongoose=require('mongoose')
var channelSchema=require('../schemas/channel')

module.exports = mongoose.model('Channel',channelSchema)