const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.set('view engine', 'ejs');


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls', (req, res) => {
  let templateVars = {
    username: req.cookies['username'],
    urls: urlDatabase
  };

  console.log(templateVars);
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  let templateVars = {
    username: req.cookies['username']
  }

  res.render('urls_new', templateVars);
})

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = {
    username: req.cookies['username'],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render('urls_show', templateVars);
});

// add longURL shortURL to database object
app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = longURL;

  let templateVars = {
    username: req.cookies['username'],
    shortURL,
    longURL
  };
  res.render('urls_show', templateVars);

});

// redirect to longURL page when click on shortURL
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (!longURL) {
    res.send('<h1>Error! Please input correct shortURL.</h1>')
  } else {
    res.redirect(longURL);
  }
});


// remove post with delete button
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];

  let templateVars = {
    username: req.cookies['username'],
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

// edit an existing post from the shortURL
app.post('/urls/:id', (req, res) => {

  const newLongURL = req.body.editURL;
  const shortURL = req.params.id;

  urlDatabase[shortURL] = newLongURL;

  let templateVars = {
    username: req.cookies['username'],
    shortURL,
    longURL: newLongURL
  };
  res.render('urls_show', templateVars);

});

// Store username as cookie
app.post('/login', (req, res) => {
  const username = req.body.username;

  res.cookie('username', username);

  res.redirect('/urls');
});

// logout and remove username from cookies
app.post('/logout', (req, res) => {

  res.clearCookie('username');

  res.redirect('/urls');
});



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