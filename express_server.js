const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const users = {};
const urlDatabase = {};
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession( {
  name: 'session',
  keys: ['secret'],
  maxAge: 24 * 60 * 60 * 1000
}));

const randomNumber = () => {
  return Math.floor(Math.random() * 1e9).toString(32);
};

function filter(database, request) {
  let output = {};
  for (let link in urlDatabase) {
    if (urlDatabase[link].createdBy === request.session['user_id']) {
      output[link] = urlDatabase[link];
    }
  }
  return output;
}

app.get('/login', (request, response) => {
  let email = (users[request.session['user_id']]) ? users[request.session['user_id']].email : '';
  let templateVars = {id: request.session['id'], email: email, urls: urlDatabase};
  if (email) {
    response.redirect('/');
    return;
  }
  response.render('login', templateVars);
});

app.post('/login', (request, response) => {
  for (let i in users) {
    if (request.body['email'] === users[i].email) {
      if ( bcrypt.compareSync(request.body['password'], users[i].password)) {
        request.session.user_id = users[i].id;
        response.redirect('/');
        return;
      } else {
        response.status(401).send('Incorrect Email or Password');
        return;
      }
    }
  }
  response.status(401).send('Incorrect Email or Password');
});

app.post('/logout', (request, response) => {
  request.session.user_id = null;
  response.redirect('/');
});

app.post('/register', (request, response) => {
  for (let i in users) {
    if (users[i].email === request.body['email']) {
      response.status(400).send('Email is already registered');
      return;
    }
  }
  if (!request.body['email'] || !request.body['password']) {
    response.status(400).send('Please confirm you completed both fields properly');
    return;
  }
  const password = request.body['password'];
  const hashed_password = bcrypt.hashSync(password, 10);
  let randomId = randomNumber();
  users[randomId] = {id: randomId, email: request.body['email'], password: hashed_password};
  request.session.user_id = randomId;
  response.redirect('/');
});


app.get('/register', (request, response) => {
  let email = (users[request.session['user_id']]) ? users[request.session['user_id']].email : '';
  let templateVars = {id: request.session['id'], email: email, urls: urlDatabase};
  if (email) {
    response.redirect('/');
    return;
  }
  response.render('register', templateVars);
});

app.get('/urls/new', (request, response) => {
  let email = (users[request.session['user_id']]) ? users[request.session['user_id']].email : '';
  let templateVars = {id: request.session['id'], email: email, urls: urlDatabase};
  if (!email) {
    response.status(401).send(`Please <a href =/login>login</a> to see your links`);
    return;
  }
  response.render('urls_new', templateVars);
});

app.post('/urls', (request, response) => {
  let email = (users[request.session['user_id']]) ? users[request.session['user_id']].email : '';
  let templateVars = {id: request.session['id'], email: email, urls: urlDatabase, shortURL: request.params.id};
  if (!email) {
    response.status(401).send(`Please <a href =/login>login</a> to see your links`);
    return;
  }
  let rando = randomNumber();
  if (!request.body.longURL) {
    response.redirect('/urls/new');
    return;
  }
  urlDatabase[rando] = {longURL: request.body.longURL, createdBy: request.session['user_id']};
  response.redirect(`/urls/${rando}`);
});

app.post('/urls/:id/delete', (request, response) => {
  let email = (users[request.session['user_id']]) ? users[request.session['user_id']].email : '';
  let templateVars = {id: request.session['id'], email: email, urls: urlDatabase};
  if (!email) {
    response.redirect('/login');
    return;
  }
  if (urlDatabase[request.params.id].createdBy !== users[request.session.user_id].id) {
    response.status(404).send('This link does not belong to this account');
    return;
  }
  delete urlDatabase[request.params.id];
  response.redirect('/urls');
});

app.post('/urls/:id/update', (request, response) => {
  let email = (users[request.session['user_id']]) ? users[request.session['user_id']].email : '';
  let templateVars = {id: request.session['id'], email: email, urls: urlDatabase};
  if (!email) {
    response.status(401).send(`Please <a href =/login>login</a> to see your links`);
    return;
  }
  if (urlDatabase[request.params.id].createdBy !== request.session.user_id) {
    response.status(404).send('This link does not belong to this account');
    return;
  }
  urlDatabase[request.params.id].longURL = request.body.longURL;
  response.redirect(`/urls/${request.params.id}`);
});

app.get('/u/:shortURL', (request, response) => {
  if (!urlDatabase[request.params.shortURL]){
    response.status(404).send('This link does not exist in our database');
    return;
  }
  let longURL = urlDatabase[request.params.shortURL].longURL;
  response.redirect(longURL);
});

app.get('/urls/:id', (request, response) => {
  let email = (users[request.session['user_id']]) ? users[request.session['user_id']].email : '';
  let templateVars = {id: request.session['id'], email: email, urls: urlDatabase, shortURL: request.params.id};
  if (!urlDatabase[request.params.id]) {
    response.status(404).send('This link does not exist in our database');
    return;
  }
  if (!email) {
    response.status(401).send(`Please <a href =/login>login</a> to see your links`);
    return;
  }
  if (urlDatabase[request.params.id].createdBy !== request.session.user_id) {
    response.status(403).send('This link does not belong to this account');
    return;
  }
  templateVars.longURL = urlDatabase[request.params.id].longURL;
  response.render('urls_show', templateVars);
});

app.get('/urls', (request, response) => {
  let url = filter(urlDatabase, request);
  let email = (users[request.session['user_id']]) ? users[request.session['user_id']].email : '';
  let templateVars = {id: request.session['id'], email: email, urls: url};
  if (!email) {
    response.status(401).send(`Please <a href =/login>login</a> to see your links`);
    return;
  }
  response.render('urls_index', templateVars);
});

app.get('/', (request, response) => {
  let email = (users[request.session['user_id']]) ? users[request.session['user_id']].email : '';
  let templateVars = {id: request.session['id'], email: email};
  if (!email) {
    response.redirect('/login');
    return;
  }
  response.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});