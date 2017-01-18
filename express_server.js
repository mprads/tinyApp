const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));

app.get('/urls/new', (request, response) => {
  response.render('urls_new');
});

app.post('/urls', (request, response) => {
  let rando = randomNumber();
  urlDatabase[rando] = request.body.longURL;
  response.redirect(`http://localhost:8080/urls/${rando}`);
  console.log(urlDatabase);
});

app.get('/u/:shortURL', (request, response) => {
  let longURL = urlDatabase[request.params.shortURL];
  response.redirect(longURL);
});

app.get('/urls/:id', (request, response) => {
  let templateVars = { shortURL: request.params.id };
  templateVars.LongURL = urlDatabase[request.params.id] || 'Not in database';
  response.render("urls_show", templateVars);
});

app.get('/urls', (request, response) =>{
  let templateVars = {urls: urlDatabase};
  response.render('urls_index', templateVars);
});


app.set('view engine', 'ejs');

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

app.get('/', (request, response) => {
  response.end('Hello!');
});

app.get('/urls.json', (request, response) => {
  response.json(urlDatabase);
});

app.get('/hello', (request, response) => {
  response.end('<html><body>Hello <b>World</b></body></html>\n');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);

});

const randomNumber = () => {
  return Math.floor(Math.random()* 1e10).toString(32);
};
