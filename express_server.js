const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const alert = require('alert');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const { getUserByEmail,
  generateRandomString,
  emailLookup,
  urlsForUser,
  calculateTotalVisitors,
  calculateUniqueVisits } = require('./helpers');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', "key2"]
}));
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');

const urlDatabase = {};
const users = {};

const urlVisitorsDB = {
  // shortURL: {
  //   visitorID1: [ts1, ts2],
  //   visitorID2: [ts1, ts2]
  // }
}

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

  // Stretch - analysis of visitors to specific shortURL
  let totalVisitors = calculateTotalVisitors(req.params.shortURL, urlVisitorsDB);
  let uniqueVisits = calculateUniqueVisits(req.params.shortURL, urlVisitorsDB);

  const shortURLVisits = urlVisitorsDB[req.params.shortURL];

  let templateVars = {
    user: users[req.session.user_id],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    totalVisitors,
    uniqueVisits,
    shortURLVisits
  };
  res.render('urls_show', templateVars);
});

// add longURL shortURL to database object
app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = { longURL, userID: req.session.user_id };
  urlVisitorsDB[shortURL] = {};

  const filteredUrls = urlsForUser(req.session.user_id, urlDatabase);

  let templateVars = {
    user: users[req.session.user_id],
    shortURL,
    longURL,
    urls: filteredUrls
  };

  res.render('urls_index', templateVars);
});

// redirect to longURL page when click on shortURL
// the link that can be used by public
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  const short = req.params.shortURL;
  if (!longURL) {
    res.status(404).send('<h1>Error! Please input correct shortURL.</h1>');
  } else {
    res.redirect(longURL);

    const timeStamp = new Date();
    const visitorID = req.session.user_id;

    if (!(urlVisitorsDB[short][visitorID])) {
      urlVisitorsDB[short][visitorID] = [timeStamp];
    } else {
      urlVisitorsDB[short][visitorID].push(timeStamp);
    }

  }
});


// remove post with delete button
app.delete('/urls/:shortURL/delete', (req, res) => {
  // prevents user not logged in from deleting url
  if (!req.session.user_id) {
    res.status(401).send('<h1>Status of 401: Unauthorized Access.</h1>');
    return;
  } else if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    res.status(404).send('<h1>Status of 401: Unauthorized Access.</h1>');
    return;
  }

  delete urlDatabase[req.params.shortURL];
  delete urlVisitorsDB[req.params.shortURL];

  const filteredUrls = urlsForUser(req.session.user_id, urlDatabase);

  let templateVars = {
    user: users[req.session.user_id],
    urls: filteredUrls
  };
  res.render('urls_index', templateVars);
});

// edit an existing post from the shortURL
app.put('/urls/:id', (req, res) => {
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


