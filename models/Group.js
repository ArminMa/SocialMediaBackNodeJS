
var _id = '';
var users = [];
var UserInit = require('./UserInfo');

// Constructor
function Group() {
}
// class methods
Group.prototype.addUser = function(user) {
    this.users.push(user);
};
Group.prototype.putUser = function(username) {
    var userInformation = new UserInit(username);
    this.users.push(userInformation);
};
Group.prototype.putUser = function(username, theSocket) {
    var userInformation = new UserInit(username, theSocket);
    this.users.push(userInformation);
};
Group.prototype.setId = function(id) {
    this._id = id;
};
Group.prototype.getId = function() {
    return this._id;
};
Group.prototype.getUsers = function() {
    return this.users;
};

Group.prototype.getAsJson = function() {
    return {
        '_id':this._id,
        'users':this.users
    };
};

Group.prototype.getAsJsonString = function() {
    var userJson = {
        '_id':this._id,
        'users':this.users
    };
    return JSON.stringify(userJson);
};

// export the class
module.exports = Group;