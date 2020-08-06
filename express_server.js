const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const alert = require('alert');
const bcrypt = require('bcrypt');
const { getUserByEmail, generateRandomString, emailLookup, urlsForUser } = require('./helpers');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', "key2"]
}));

app.set('view engine', 'ejs');

const urlDatabase = {};
const users = {};

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {

  if (!req.session.user_id) {
    alert('Please login to view URLS!');
    res.redirect('/login');
    return;
  }

  const filteredUrls = urlsForUser(req.session.user_id, urlDatabase);

  let templateVars = {
    user: users[req.session.user_id],
    urls: filteredUrls
  };

  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {

  if (!req.session.user_id) {
    alert('Please login to create new URL!');
    res.redirect('/login');
    return;
  }

  let templateVars = {
    user: users[req.session.user_id]
  };

  res.render('urls_new', templateVars);
});

// registration form get request
app.get('/register', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };

  res.render('urls_registration', templateVars);
});

// login page get request
app.get('/login', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };

  res.render('urls_login', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {

  if (!req.session.user_id) {
    alert('Please login to view URLS!');
    res.redirect('/login');
    return;
  }

  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send('<h1>Status of 404: Not Found.');
    return;
  }

  // if user trying to modify other user's shortURL
  if (users[req.session.user_id].id !== urlDatabase[req.params.shortURL].userID) {
    res.status(404).send('<h1>Status of 401: Unauthorized Access.');
    return;
  }

  let templateVars = {
    user: users[req.session.user_id],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render('urls_show', templateVars);
});

// add longURL shortURL to database object
app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = { longURL, userID: req.session.user_id };

  let templateVars = {
    user: users[req.session.user_id],
    shortURL,
    longURL
  };

  res.render('urls_show', templateVars);
});

// redirect to longURL page when click on shortURL
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (!longURL) {
    res.status(404).send('<h1>Error! Please input correct shortURL.</h1>');
  } else {
    res.redirect(longURL);
  }
});


// remove post with delete button
app.post('/urls/:shortURL/delete', (req, res) => {
  // prevents user not logged in from deleting url
  if (!req.session.user_id) {
    res.status(401).send('<h1>Status of 401: Unauthorized Access.</h1>');
    return;
  } else if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    res.status(404).send('<h1>Status of 401: Unauthorized Access.</h1>');
    return;
  }

  delete urlDatabase[req.params.shortURL];
  const filteredUrls = urlsForUser(req.session.user_id, urlDatabase);

  let templateVars = {
    user: users[req.session.user_id],
    urls: filteredUrls
  };
  res.render('urls_index', templateVars);
});

// edit an existing post from the shortURL
app.post('/urls/:id', (req, res) => {
  // prevents user not logged in from editing url
  if (!req.session.user_id) {
    res.status(401).send('<h1>Status of 401: Unauthorized Access.');
    return;
  } else if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    res.status(401).send('<h1>Status of 401: Unauthorized Access.');
    return;
  }

  const newLongURL = req.body.editURL;
  const shortURL = req.params.id;

  urlDatabase[shortURL].longURL = newLongURL;

  const filteredUrls = urlsForUser(req.session.user_id, urlDatabase);

  let templateVars = {
    user: users[req.session.user_id],
    shortURL,
    longURL: newLongURL,
    urls: filteredUrls
  };

  res.render('urls_index', templateVars);
});

// Login and Store username as cookie
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = getUserByEmail(email, users);

  if (!Object.keys(user).length) {
    res.status(403).send('<h1>Status of 403: Forbidden Request. Please Enter Valid Email/Password</h1>');
    return;
  }

  if (user.email && bcrypt.compareSync(password, user.password)) {
    req.session.user_id = user.id;
    res.redirect('/urls');
    return;
  }

  // if username is OK but password does not match
  res.status(403).send('<h1>Status of 403: Forbidden Request. Please Enter Valid Email/Password</h1>');
  return;
});

// logout and remove username from cookies
app.post('/logout', (req, res) => {
  req.session = null;

  res.redirect('/login');
});


// registration form post req
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = generateRandomString();

  if (!email || !password) {
    res.send('<h1>Status of 400: Bad Request. Please Enter Valid Email/Password</h1>');
    return;
  }

  const isEmailInUse = emailLookup(email, users);

  if (isEmailInUse) {
    res.status(400).send('<h1>Status of 400: Bad Request. Username Already In Use</h1>');
    return;
  }

  users[id] = {
    id,
    email,
    password: hashedPassword
  };

  req.session.user_id = id;

  res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listenting on port ${PORT}`);
});


