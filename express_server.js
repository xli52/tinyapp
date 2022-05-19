const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'ejs');

const urlDatabase = {
  AaAaAa: 'http://www.lighthouselabs.ca'
};

const users = {};

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString() 
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.post('/urls/:shortURL/edit', (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const userID = findUserIDWithEmail(email);
  res.cookie('userID', userID);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  if (!req.body.email || ! req.body.password) {
    return res.status(400).send('Please enter an email address and a password');
  }
  if (findUserIDWithEmail(req.body.email)) {
    return res.status(400).send('Email has been linked to an existing account');
  }
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  
  users[id] = { id, email, password };
  res.cookie('userID', id);
  res.redirect('/urls');
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/register', (req, res) => {
  const user = users[req.cookies['userID']];
  res.render('urls_register', {user});
});

app.get('/login', (req, res) => {
  const user = users[req.cookies['userID']];
  res.render('urls_login', {user});
});

app.get('/urls/new', (req, res) => {
  const user = users[req.cookies['userID']];
  res.render('urls_new', {user});
});

app.get('/urls', (req, res) => {
  const user = users[req.cookies['userID']];
  res.render('urls_index', { user, urls: urlDatabase });
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[req.params.shortURL];
  const user = users[req.cookies['userID']];
  res.render("urls_show", { user, shortURL, longURL });
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  const charString = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * charString.length);
    randomString += charString.charAt(randomIndex);
  }
  return randomString;
}

function findUserIDWithEmail(email) {
  let foundUserID = null;
  for (userID in users) {
    if (users[userID].email === email) foundUserID = userID;
  }
  return foundUserID;
}