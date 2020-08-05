const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const alert = require('alert');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: '4mFAue' },
  "9sm5xK": { longURL: "http://www.google.com", userID: '4mFAue' },
};

const users = {
  "4mFAue": {
    id: "4mFAue",
    email: "user@example.com",
    password: "purple"
  }
};

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls', (req, res) => {

  if (!req.cookies['user_id']) {
    alert('Please login to view URLS!');
    res.redirect('/login');
    return;
  }

  const filteredUrls = urlsForUser(req.cookies['user_id']);

  let templateVars = {
    user: users[req.cookies['user_id']],
    urls: filteredUrls
  };

  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {

  if (!req.cookies['user_id']) {
    alert('Please login to create new URL!');
    res.redirect('/login');
    return;
  }

  let templateVars = {
    user: users[req.cookies['user_id']]
  }

  res.render('urls_new', templateVars);
});

// registration form get request
app.get('/register', (req, res) => {
  let templateVars = {
    user: users[req.cookies['user_id']]
  };

  res.render('urls_registration', templateVars);
});

// login page get request
app.get('/login', (req, res) => {
  let templateVars = {
    user: users[req.cookies['user_id']]
  };

  res.render('urls_login', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {

  if (!req.cookies['user_id']) {
    alert('Please login to view URLS!');
    res.redirect('/login');
    return;
  }

  console.log(urlDatabase);
  console.log(req.params.shortURL);

  let templateVars = {
    user: users[req.cookies['user_id']],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render('urls_show', templateVars);
});

// add longURL shortURL to database object
app.post('/urls/new', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = { longURL, userID: req.cookies['user_id'] };

  let templateVars = {
    user: users[req.cookies['user_id']],
    shortURL,
    longURL
  };

  console.log(urlDatabase);

  res.render('urls_show', templateVars);

});

// redirect to longURL page when click on shortURL
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (!longURL) {
    res.send('<h1>Error! Please input correct shortURL.</h1>')
  } else {
    res.redirect(longURL);
  }
});


// remove post with delete button
app.post('/urls/:shortURL/delete', (req, res) => {
  // prevents user not logged in from deleting url
  if (!req.cookies['user_id']) {
    res.send('<h1>Status of 401: Unauthorized Access.');
    return;
  } else if (urlDatabase[req.params.shortURL].userID !== req.cookies['user_id']) {
    res.send('<h1>Status of 401: Unauthorized Access.');
    return;
  }

  delete urlDatabase[req.params.shortURL];
  const filteredUrls = urlsForUser(req.cookies['user_id']);

  console.log(urlDatabase);
  console.log(filteredUrls);

  let templateVars = {
    user: users[req.cookies['user_id']],
    urls: filteredUrls
  };
  res.render('urls_index', templateVars);
});

// edit an existing post from the shortURL
app.post('/urls/:id', (req, res) => {
  // prevents user not logged in from editing url
  if (!req.cookies['user_id']) {
    res.send('<h1>Status of 401: Unauthorized Access.');
    return;
  } else if (urlDatabase[req.params.id].userID !== req.cookies['user_id']) {
    res.send('<h1>Status of 401: Unauthorized Access.');
    return;
  }

  const newLongURL = req.body.editURL;
  const shortURL = req.params.id;

  urlDatabase[shortURL].longURL = newLongURL;

  let templateVars = {
    user: users[req.cookies['user_id']],
    shortURL,
    longURL: newLongURL
  };
  res.render('urls_show', templateVars);

});

// Login and Store username as cookie
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const isEmailInUsers = emailLookup(email);

  if (!isEmailInUsers) {
    res.send('<h1>Status of 403: Forbidden Request. Please Enter Valid Email/Password</h1>');
    return;
  }

  for (let user in users) {
    if (users[user].email === email && users[user].password === password) {
      res.cookie('user_id', user);
      res.redirect('/urls');
      return;
    }
  }

  // if username is OK but password does not match
  res.send('<h1>Status of 403: Forbidden Request. Please Enter Valid Email/Password</h1>');
  return;

});

// logout and remove username from cookies
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');

  res.redirect('/login');
});


// registration form post req
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();

  if (!email || !password) {
    res.send('<h1>Status of 400: Bad Request. Please Enter Valid Email/Password</h1>');
    return;
  }

  const isEmailInUse = emailLookup(email);

  if (isEmailInUse) {
    res.send('<h1>Status of 400: Bad Request. Username Already In Use</h1>');
    return;
  }

  users[id] = {
    id,
    email,
    password
  };

  res.cookie('user_id', id);

  res.redirect('/urls');
})


app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
})

app.listen(PORT, () => {
  console.log(`Example app listenting on port ${PORT}`);
});



// Generate string of 6 random alphanumeric characters
function generateRandomString() {

  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  let randomStr = '';

  for (let i = 0; i < 6; i++) {
    const randomNum = Math.floor(Math.random() * chars.length);
    randomStr += chars[randomNum];
  }

  return randomStr;

}

function emailLookup(email) {

  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  }

  return false;
}


function urlsForUser(id) {

  let result = {};

  for (let user in urlDatabase) {
    if (urlDatabase[user].userID === id) {
      result[user] = urlDatabase[user];
    }
  }

  return result;

}