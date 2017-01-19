const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const users = {};

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.post('/login', (request, response) => {
  response.cookie('username', request.body.username);
  response.redirect('/urls');
});

app.post('/logout', (request, response) => {
  response.clearCookie('username')
  response.redirect('/');
});

app.post('/register', (request, response) => {
  let randomId = randomNumber();
  users[randomId] = {Id: [randomId], email: request.body['email'], password: request.body['password']}
  response.cookie('user_id', randomId);
  response.redirect('/')
});


app.get('/register', (request, response) => {
  let templateVars = { username: request.cookies['username']};
  response.render('register',templateVars);
});

app.get('/urls/new', (request, response) => {
  let templateVars = { username: request.cookies['username']};
  response.render('urls_new',templateVars);
});

app.post('/urls', (request, response) => {
  let rando = randomNumber();
  if (!request.body.longURL){
   response.redirect('/urls/new');
   return;
 }
  for (let k in urlDatabase) {
    if (urlDatabase[k] == request.body.longURL) {
      response.redirect(`/urls/${k}`);
      return;
    }
  }
  urlDatabase[rando] = request.body.longURL
  response.redirect(`/urls/${rando}`);

  console.log(urlDatabase);
});

app.post('/urls/:id/delete', (request, response) => {
  delete urlDatabase[request.params.id];
  response.redirect('/urls');
});

app.post('/urls/:id/update', (request, response) => {
  urlDatabase[request.params.id] = request.body.longURL;
  response.redirect('/urls');
});

app.get('/u/:shortURL', (request, response) => {
  let longURL = urlDatabase[request.params.shortURL];
  response.redirect(longURL);
});

app.get('/urls/:id', (request, response) => {
  let templateVars = { username: request.cookies['username'], shortURL: request.params.id };
  templateVars.longURL = urlDatabase[request.params.id] || 'Not in database';
  response.render("urls_show", templateVars);
});

app.get('/urls', (request, response) =>{
  let templateVars = {username: request.cookies['username'], urls: urlDatabase};
  response.render('urls_index', templateVars);
});


app.set('view engine', 'ejs');

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

app.get('/', (request, response) => {
  response.end('Hello and Welcome to TINY URL \n The Place For All Your Shortening Needs');
});

app.get('/users.json', (request, response) => {
  response.json(users);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);

});

const randomNumber = () => {
  return Math.floor(Math.random()* 1e9).toString(32);
};