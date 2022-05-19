const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const PORT = 8080;
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'ejs');

const urlDatabase = {};
const users = {};

// Generate a short url and add to the urlDatabase
app.post('/urls', (req, res) => {
  if (!req.cookies.userID) {
    return handleError(res, 403, 'Invalid request');
  }

  const longURL = req.body.longURL;
  if (!longURL) {
    return;
  }
  const shortURL = generateRandomString() 
  const userID = req.cookies.userID;
  urlDatabase[shortURL] = {longURL, userID};
  res.redirect(`/urls/${shortURL}`);
});

// Update the longURL of a given url in the urlDatabase
app.post('/urls/:shortURL', (req, res) => {
  if (!req.cookies.userID) {
    return handleError(res, 403, 'Invalid request');
  }

  const shortURL = req.params.shortURL;

  if (!urlDatabase[shortURL]) {
    return handleError(res, 404, 'Page not found');
  }
  if (urlDatabase[shortURL].userID !== req.cookies.userID) {
    return handleError(res, 403, 'Invalid request');
  }
  
  const longURL = req.body.longURL;
  if (!longURL) {
    return;
  }
  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/urls/${shortURL}`);
});

// Delele a url from urlDatabase
app.post('/urls/:shortURL/delete', (req, res) => {
  if (!req.cookies.userID) {
    return handleError(res, 403, 'Invalid request');
  }
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    return handleError(res, 404, 'Page not found');
  }
  if (urlDatabase[shortURL].userID !== req.cookies.userID) {
    return handleError(res, 403, 'Invalid request');
  }
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// Go to the edit page of a given url
app.post('/urls/:shortURL/edit', (req, res) => {
  if (!req.cookies.userID) {
    return handleError(res, 403, 'Invalid request');
  }
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    return handleError(res, 404, 'Page not found');
  }
  if (urlDatabase[shortURL].userID !== req.cookies.userID) {
    return handleError(res, 403, 'Invalid request');
  }

  res.redirect(`/urls/${shortURL}`);
});

// Logout and clear cookies
app.post('/logout', (req, res) => {
  res.clearCookie('userID');
  res.redirect('/urls');
});

// Check input email and password, login in if valid
// Add userID to cookie 
app.post('/login', (req, res) => {
  if (req.cookies.userID) {
    return handleError(res, 403, 'Please logout first');
  }
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return handleError(res, 400, 'Please enter an email address and a password'); 
  }
  const userID = findUserIDWithEmail(email);
  if (!userID) {
    return handleError(res, 403, 'User not found'); 
  }
  if (users[userID].password !== password) {
    return handleError(res, 403, 'Incorrect password'); 
  }
  res.cookie('userID', userID);
  res.redirect('/urls');
});

// Check if input email and password are valid
// Generate a userID for the new user, add new user to users
// Add userID to the cookie
app.post('/register', (req, res) => {
  if (req.cookies.userID) {
    return handleError(res, 403, 'Please logout first');
  }
  
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return handleError(res, 400, 'Please enter an email address and a password');
  }
  if (findUserIDWithEmail(email)) {
    return handleError(res, 400, 'Email has been linked to an existing account');
  }
  const id = generateRandomString();
  
  users[id] = { id, email, password };
  res.cookie('userID', id);
  res.redirect('/urls');
});

// Go to the longURL website
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// Render the register page
app.get('/register', (req, res) => {
  if (req.cookies.userID) {
    return handleError(res, 403, 'Please logout first');
  }
  const user = users[req.cookies['userID']];
  res.render('urls_register', {user});
});

// Render the login page
app.get('/login', (req, res) => {
  if (req.cookies.userID) {
    return handleError(res, 403, 'Please logout first');
  }
  const user = users[req.cookies['userID']];
  res.render('urls_login', {user});
});

// Render the add new url page
app.get('/urls/new', (req, res) => {
  const user = users[req.cookies.userID];
  res.render('urls_new', {user});
});

// Render the url list page
app.get('/urls', (req, res) => {
  const user = users[req.cookies.userID];
  res.render('urls_index', { user, urls: urlDatabase });
});

// Render the show/edit url page of a given short url
app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.cookies.userID];
  if (!user) {
    return handleError(res, 403, 'Please login or register first');
  }
  
  const shortURL = req.params.shortURL;
  
  if (!urlDatabase[shortURL]) {
    return handleError(res, 404, 'Page not found')
  }

  const longURL = urlDatabase[shortURL].longURL;
  res.render("urls_show", { user, shortURL, longURL });
});

// Throw 404 to catch all invalid urls
app.get('*', (req, res) => {
  handleError(res, 404, 'Page not found')
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Helper function that generate a random 6-character string
function generateRandomString() {
  const charString = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * charString.length);
    randomString += charString.charAt(randomIndex);
  }
  return randomString;
}

// Helper function that find the userID from a given email address
function findUserIDWithEmail(email) {
  let foundUserID = null;
  for (userID in users) {
    if (users[userID].email === email) foundUserID = userID;
  }
  return foundUserID;
}

// Helper function that handle error message

function handleError(res, status, message) {
  res.status(status).send(message);
}