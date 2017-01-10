
var _id = '';
var users = [];
var UserInfo = require('./UserInfo');
var userInfo1 = null;
var userInfo2 = null;
// Constructor
function Group(user1, user2) {
    this.userInfo1 = user1;
    this.userInfo2 = user2;
}

Group.prototype.setId = function(id) {
    this._id = id;
};
Group.prototype.getId = function() {
    return this._id;
};

Group.prototype.setUserInfo1 = function(userInfo) {
    this.userInfo1 = userInfo;
};
Group.prototype.getUserInfo1 = function() {
    return this.userInfo1;
};

Group.prototype.setUserInfo2 = function(userInfo) {
    this.userInfo2 = userInfo;
};
Group.prototype.getUserInfo2 = function() {
    return this.userInfo2;
};

// export the class
module.exports = Group;