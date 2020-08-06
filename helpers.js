const getUserByEmail = function(email, userDatabase) {

  let user = {};

  for (let singleUser in userDatabase) {
    if (userDatabase[singleUser].email === email) {
      user = userDatabase[singleUser];
    }
  }

  return user;

}

module.exports = { getUserByEmail };