const getUserByEmail = function(email, userDatabase) {

  let user = {};

  for (let singleUser in userDatabase) {
    if (userDatabase[singleUser].email === email) {
      user = userDatabase[singleUser];
    }
  }

  return user;

}

// Generate string of 6 random alphanumeric characters
const generateRandomString = function() {

  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  let randomStr = '';

  for (let i = 0; i < 6; i++) {
    const randomNum = Math.floor(Math.random() * chars.length);
    randomStr += chars[randomNum];
  }

  return randomStr;

}

const emailLookup = function(email, users) {

  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  }

  return false;
}


const urlsForUser = function(id, urlDatabase) {

  let result = {};

  for (let user in urlDatabase) {
    if (urlDatabase[user].userID === id) {
      result[user] = urlDatabase[user];
    }
  }

  return result;

}


const calculateTotalVisitors = function(short, visitorsDB) {

  let count = 0;

  for (let shortURL in visitorsDB) {
    if (shortURL === short) {
      for (let visitorID in visitorsDB[shortURL]) {
        count += visitorsDB[shortURL][visitorID].length;
      }
    }
  }

  return count;

}
const calculateUniqueVisits = function(short, visitorsDB) {

  let count = 0;

  for (let shortURL in visitorsDB) {
    if (shortURL === short) {
      count += Object.keys(visitorsDB[shortURL]).length;
    }
  }

  return count;

}

module.exports = { getUserByEmail, generateRandomString, emailLookup, urlsForUser, calculateTotalVisitors, calculateUniqueVisits };