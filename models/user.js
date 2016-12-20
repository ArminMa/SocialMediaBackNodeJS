var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('User', new Schema({

	"id": String,
	"username":String,
	"email":String,
	"password":String,

	"authorities":[{"id":String,"isLocked":Boolean,"authority":{"authority":"String","id":String}}]

}));