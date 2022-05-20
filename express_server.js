const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const { generateRandomString, findUserIDWithEmail } = require('./helper');

const PORT = 8080;
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2', 'key3']
}));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

const urlDatabase = {};
const users = {};

// Generate a short url and add to the urlDatabase
app.post('/urls', (req, res) => {
  if (!req.session.userID) {
    return res.status(403).send('Invalid request');
  }

  const longURL = req.body.longURL;
  if (!longURL) {
    return;
  }
  const shortURL = generateRandomString();
  const userID = req.session.userID;
  urlDatabase[shortURL] = {longURL, userID, visits: [], visitors: []};
  res.redirect(`/urls/${shortURL}`);
});

// Update the longURL of a given url in the urlDatabase
app.put('/urls/:shortURL', (req, res) => {
  if (!req.session.userID) {
    return res.status(403).send('Invalid request');
  }

  const shortURL = req.params.shortURL;

  if (!urlDatabase[shortURL]) {
    return res.status(404).send('Page not found');
  }
  if (urlDatabase[shortURL].userID !== req.session.userID) {
    return res.status(403).send('Invalid request');
  }
  
  const longURL = req.body.longURL;
  if (!longURL) {
    return;
  }
  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/urls/${shortURL}`);
});

// Delele a url from urlDatabase
app.delete('/urls/:shortURL/delete', (req, res) => {
  if (!req.session.userID) {
    return res.status(403).send('Invalid request');
  }
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    return res.status(404).send('Page not found');
  }
  if (urlDatabase[shortURL].userID !== req.session.userID) {
    return res.status(403).send('Invalid request');
  }
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// Go to the edit page of a given url
app.post('/urls/:shortURL/edit', (req, res) => {
  if (!req.session.userID) {
    return res.status(403).send('Invalid request');
  }
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    return res.status(404).send('Page not found');
  }
  if (urlDatabase[shortURL].userID !== req.session.userID) {
    return res.status(403).send('Invalid request');
  }
  res.redirect(`/urls/${shortURL}`);
});

// Logout and clear cookies
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// Check input email and password, login in if valid
// Add userID to cookie
app.post('/login', (req, res) => {
  if (req.session.userID) {
    return res.status(403).send('Please logout first');
  }
  const password = req.body.password;
  const email = req.body.email;
  if (!email || !password) {
    return res.status(400).send('Please enter an email address and a password');
  }
  const userID = findUserIDWithEmail(email, users);
  if (!userID) {
    return res.status(403).send('User not found');
  }
  if (!bcrypt.compareSync(password, users[userID].password)) {
    return res.status(403).send('Incorrect password');
  }
  req.session.userID = userID;
  res.redirect('/urls');
});

// Check if input email and password are valid
// Generate a userID for the new user, add new user to users
// Add userID to the cookie
app.post('/register', (req, res) => {
  if (req.session.userID) {
    return res.status(403).send('Please logout first');
  }
  
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(400).send('Please enter an email address and a password');
  }
  if (findUserIDWithEmail(email, users)) {
    return res.status(400).send('Email has been linked to an existing account');
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = generateRandomString();
  
  users[id] = { id, email, password: hashedPassword };
  req.session.userID = id;
  res.redirect('/urls');
});

// Visit a shortURL
app.get('/u/:shortURL', (req, res) => {
  // Check if user is logged in
  const user = users[req.session.userID];
  if (!user) {
    return res.status(403).send('Please login or register first');
  }
  // Check if input shortURL is valid
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    return res.status(404).send('Page not found');
  }
  // Add visitor id if this is a first time visit
  const visitors = urlDatabase[shortURL].visitors;
  if (!visitors.includes(user.id)) {
    visitors.push(user.id);
  }
  // Create a new visit and add to the visit list
  const visitorID = generateRandomString();
  const timeStamp = new Date();
  timeStamp.toISOString();
  urlDatabase[shortURL].visits.push({visitorID, timeStamp});
  //Redirect to the actual web url (longURL)
  const longURL = urlDatabase[shortURL].longURL;
  console.log(urlDatabase);
  res.redirect(longURL);
});

// Render the register page
app.get('/register', (req, res) => {
  if (req.session.userID) {
    return res.status(403).send('Please logout first');
  }
  const user = users[req.session['userID']];
  res.render('urls_register', {user});
});

// Render the login page
app.get('/login', (req, res) => {
  if (req.session.userID) {
    return res.status(403).send('Please logout first');
  }
  const user = users[req.session['userID']];
  res.render('urls_login', {user});
});

// Render the add new url page
app.get('/urls/new', (req, res) => {
  const user = users[req.session.userID];
  res.render('urls_new', {user});
});

// Render the url list page
app.get('/urls', (req, res) => {
  const user = users[req.session.userID];
  res.render('urls_index', { user, urls: urlDatabase });
});

// Render the show/edit url page of a given short url
app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.session.userID];
  if (!user) {
    return res.status(403).send('Please login or register first');
  }
  
  const shortURL = req.params.shortURL;
  
  if (!urlDatabase[shortURL]) {
    return res.status(404).send('Page not found');
  }

  const longURL = urlDatabase[shortURL].longURL;
  const visits = urlDatabase[shortURL].visits;
  const visitors = urlDatabase[shortURL].visitors
  res.render("urls_show", { user, shortURL, longURL, visits, visitors });
});

// Throw 404 to catch all invalid urls
app.get('*', (req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});