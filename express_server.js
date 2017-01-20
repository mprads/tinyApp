const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const users = {};
// { ran123: {id: 'ran123', email: 'test1', password: 'p'},
//  dom345: {id: 'dom456', email: 'test1', password: 'p'}
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.get('/login', (request, response) => {
  let email = (request.cookies['user_id']) ? users[request.cookies['user_id']].email : '';
  let templateVars = {id: request.cookies['id'], email: email, urls: urlDatabase};
  response.render('login',templateVars);
});

app.post('/login', (request, response) => {
  for (let i in users) {
    if ( request.body['email'] === users[i].email) {
      if ( bcrypt.compareSync(request.body['password'], users[i].password)) {
        response.cookie('user_id', users[i].id);
        response.redirect('/');
        return;
      } else {
        response.send('Error: 403 \nIncorrect Email or Password');
      return;
      }
    }
  }
});

app.post('/logout', (request, response) => {
  response.clearCookie('user_id')
  response.redirect('/');
});

app.post('/register', (request, response) => {
  for (let i in users) {
    if (users[i].email === request.body['email']) {
      response.statusCode = 400;
      response.send('Error: 400 \nEmail already exists');
      return;
    }
  }
  if (!request.body['email'] || !request.body['password']) {
    response.statusCode = 400;
    response.send('Error: 400 \nPlease confirm you entered both fields properly');
    return;
  }
  const password = request.body['password']; // you will probably this from req.params
  const hashed_password = bcrypt.hashSync(password, 10);
  let randomId = randomNumber();
  users[randomId] = {id: randomId, email: request.body['email'], password: hashed_password};
  response.cookie('user_id', randomId);
  response.redirect('/')
});


app.get('/register', (request, response) => {
  let email = (request.cookies['user_id']) ? users[request.cookies['user_id']].email : '';
  let templateVars = {id: request.cookies['id'], email: email, urls: urlDatabase};
  response.render('register', templateVars);
});

app.get('/urls/new', (request, response) => {
  let email = (request.cookies['user_id']) ? users[request.cookies['user_id']].email : '';
  let templateVars = {id: request.cookies['id'], email: email, urls: urlDatabase};
  response.render('urls_new',templateVars);
});

app.post('/urls', (request, response) => {
let email = (request.cookies['user_id']) ? users[request.cookies['user_id']].email : '';
let templateVars = {id: request.cookies['id'], email: email, urls: urlDatabase};
  if (!email) {
    response.redirect('/login');
    return;
  }
  let rando = randomNumber();
  if (!request.body.longURL) {
   response.redirect('/urls/new');
   return;
 }
  for (let k in urlDatabase) {
    if (urlDatabase[k].longURL == request.body.longURL) {
      response.redirect(`/urls/${k}`);
      return;
    }
  }
  urlDatabase[rando] = {longURL: request.body.longURL, createdBy: request.cookies['user_id']};
  console.log(urlDatabase);
  response.redirect(`/urls/${rando}`);
});

app.post('/urls/:id/delete', (request, response) => {
  let email = (request.cookies['user_id']) ? users[request.cookies['user_id']].email : '';
  let templateVars = {id: request.cookies['id'], email: email, urls: urlDatabase};
  if (!email) {
    response.redirect('/login');
    return;
  };
  delete urlDatabase[request.params.id];
  response.redirect('/urls');
});

app.post('/urls/:id/update', (request, response) => {
  let email = (request.cookies['user_id']) ? users[request.cookies['user_id']].email : '';
  let templateVars = {id: request.cookies['id'], email: email, urls: urlDatabase};
  if (!email) {
    response.redirect('/login');
    return;
  };
  urlDatabase[request.params.id] = request.body.longURL;
  response.redirect('/urls');
});

app.get('/u/:shortURL', (request, response) => {
  let longURL = urlDatabase[request.params.shortURL].longURL;
  response.redirect(longURL);
});

app.get('/urls/:id', (request, response) => {
  let email = (request.cookies['user_id']) ? users[request.cookies['user_id']].email : '';
  let templateVars = {id: request.cookies['id'], email: email, urls: urlDatabase, shortURL: request.params.id};
  templateVars.longURL = urlDatabase[request.params.id].longURL || 'Not in database';
  response.render('urls_show', templateVars);
});

function filter(database,request) {
  let output = {}
  for (let link in urlDatabase) {
    if (urlDatabase[link].createdBy === request.cookies['user_id']){
      output[link] = urlDatabase[link];
    }
  }
  return output;
};

app.get('/urls', (request, response) => {
  let url = filter(urlDatabase, request);
  let email = (request.cookies['user_id']) ? users[request.cookies['user_id']].email : '';
  let templateVars = {id: request.cookies['id'], email: email, urls: url};
  response.render('urls_index', templateVars);
});

app.set('view engine', 'ejs');
const urlDatabase = {
  b2xVn2: {
    longURL: 'http://www.lighthouselabs.ca',
    createdBy: 'ran123'
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    createdBy: 'dom456'
  }
};

app.get('/', (request, response) => {
  response.redirect('/urls')
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