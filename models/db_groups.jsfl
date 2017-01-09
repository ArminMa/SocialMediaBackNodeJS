var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('db_groups', new Schema({
    'users': [{"username":String, "password":String}]
    // "startChat":String,
    // "authorities":[{"id":String,"isLocked":Boolean,"authority":{"authority":String,"id":{ type: Number } }}],
    // "index": {type: Number, index: {unique: true, dropDups: true}},
    // "online":Boolean,
    // "token": String

}));