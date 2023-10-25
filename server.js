var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser')
var app = express();
const inventory = require('./routes/inventory')
const access = require("./routes/access.js")
const email = require("./routes/email.js")
const resourcemanagement = require("./routes/resource_mgt.js")
const path = require('path')

var PORT = 8080;

// set the view engine to ejs
app.set('view engine', 'ejs');

app.use(bodyParser.json()) // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({extended:true})) // to support URL-encoded bodies

// Static Middleware
app.use(express.static(path.join(__dirname, 'lib')))

// console.log(app.use(express.static(path.join(__dirname, 'lib'))))

//Authorization
app.use(session({
    secret: '2C44-4D44-WppR38S',
    resave: false,
    saveUninitialized: false,
    credentials: 'same-origin'
  }));
  



// use res.render to load up an ejs view file

app.use(resourcemanagement,inventory,access,email)
app.listen(PORT, function(err){
    if (err) console.log(err);
    console.log("Server listening on PORT", PORT);
});
