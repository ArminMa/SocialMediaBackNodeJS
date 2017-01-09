var userSocket;
var password ='';
var username ='';
var email ='';

// Constructor
// function UserInfo( username, password, usersSocket) {
//     // always initialize all instance properties
//     this.userSocket = usersSocket;
//     this.password =password;
//     this.username =username;
// }
function UserInfo( username) {
    // always initialize all instance properties
    this.username =username;
}

// class methods
UserInfo.prototype.setSocket = function(usersSocket) {
    this.userSocket = usersSocket
};
UserInfo.prototype.getSocket = function() {
    return this.userSocket;
};
UserInfo.prototype.setPassword = function(pass) {
    password = pass
};
UserInfo.prototype.getPassword = function() {
    return this.password;
};
UserInfo.prototype.setUsername = function(name) {
    this.username = name
};
UserInfo.prototype.getUsername = function() {
    return this.username;
};

UserInfo.prototype.getAsJson = function() {
    return {
        username:this.username,
        password:this.password
    };
};

UserInfo.prototype.getAsJsonString = function() {
    var userJson = {
        username:this.username,
        password:this.password
    };

    return JSON.stringify(userJson);
};

// export the class
module.exports = UserInfo;