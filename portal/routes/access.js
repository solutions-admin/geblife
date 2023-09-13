var express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");

/**********************************************
 * Send Email
 * ***********************************************/
const hbs = require('nodemailer-express-handlebars')
const nodemailer = require('nodemailer')
const path = require('path')


/**********************************************
 * Get Secret Credentials
 * ***********************************************/
const getSecretsValues = require("../middleware/getSecrets.js")

var emailUser, emailPw, adminUser, region,accessKeyId,secretAccessKey, UserAccountTableName,emailciphers,emailPort, emailHost, dynamoDB,ses,dyanmodb,TableName = ''

const initialize = async () => {

  try {
      const secretObject = await getSecretsValues();
      emailUser = secretObject.emailUser
      emailPw = secretObject.emailPw
      adminUser = secretObject.adminUser
      region= secretObject.region
      accessKeyId = secretObject.accessKeyId
      secretAccessKey = secretObject.secretAccessKey
      UserAccountTableName = secretObject.UserAccountTableName
      emailHost = secretObject.emailHost
      emailPort = secretObject.emailPort
      emailciphers = secretObject.emailciphers




  //AWS CONNECTION
  const credentials = new AWS.Credentials({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
  });
  AWS.config.credentials = credentials;
  AWS.config.update({ region });

  // DynamoDB Connection
  TableName = UserAccountTableName; // Update with your table name
  // console.log("TableName: ", TableName)
  dynamoDB = new AWS.DynamoDB.DocumentClient();
  ses = new AWS.SES({ apiVersion: '2010-12-01' });
  dyanmodb = new AWS.DynamoDB({ region: region });

}catch(error){
  console.error('Error retrieving secret credentials:', error);
}

}

// Call the async function to initialize the application
initialize()





// Render Login Page
router.get('/login', (req, res) => {
    res.render("login")
  
})


//Post request to search dynamodb for user credentials and navigate user to current page if credentials correct
router.post('/login', (req, res) => {
    console.log(req.session)
    if (req.session && req.session.user && req.session.admin) {
      res.redirect(req.session.currentpage);
  
    }else if(!req.body.username || !req.body.password) {
      if(req.session.msg !== ''|| req.session.msg == undefined ){
        req.session.msg = "Invalid credentials: Provide credentials to gain access to page"
      }
      res.json({msg: req.session.msg, session: req.session}); //Send response
    }else{
      const { username, password } = req.body;
     console.log("username", username);
      console.log("password", password);
    
    const params = {
      TableName: TableName,
      FilterExpression: '#u = :username',
      ExpressionAttributeNames: { '#u': 'username' },
      ExpressionAttributeValues: { ':username': { S: username } }
    };
  
    dyanmodb.scan(params, (err, data) => {
      console.log("Inside scan");
      console.log(data.Items);
      if (err) {
        console.log(err);
        res.json({err: 'Error logging in'});
        // res.status(500).send('Error logging in');
      } else if (data.Items.length === 0) {
        console.log('Invalid username or password; Credentials does not exist in database')
        res.json({err: 'Invalid username or password'});
        // res.status(401).send('Invalid username or password');
      } else {
        const user = data.Items[0];
        const hashedPassword = user.password.S;
        console.log(hashedPassword);
        bcrypt.compare(password, hashedPassword, (err, result) => {
          console.log(result)
          if (err) {
            console.log(err);
            res.json({err: 'Error logging in'});
            // res.status(500).send('Error logging in');
          } else if (result) {
            req.session.user = "admin";
            req.session.admin = true;
            req.session.userFullName = user.name.S
            // Passwords match, login successful
            console.log(req.session)
            console.log('Login successful')
            currentpage = req.session.currentpage
            console.log("Navigate to: ", currentpage)
            res.json({msg: currentpage});
           
          } else {
            // Passwords do not match, login unsuccessful
            console.log("password do not match");
            res.json({err: 'Invalid Password'});
          }
        });
      }
    });
  
    }
    
});

// Render Register Page
router.get('/register', (req, res) => {
  res.render("register")
})



// Post request to register a new user, using the inputs from the client. It pust inputs in the database and sends email to the admin to approve request
router.post('/register', async (req, res) => {
  const { name, username, email, password } = req.body;

  
  console.log("username", username)
  console.log("password", password)
  console.log("email", email)
  console.log("name", name)
  console.log("TableName", TableName)

  // Generate a unique userId
  const userId = crypto.randomBytes(16).toString('hex');

  console.log("Created userId: ", userId)

 // Hash the password using bcrypt and store it securely
 const saltRounds = 10;
 const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Add the user to the DynamoDB table with approved set to false
  const params = {
    TableName: TableName,
    Item: {
      userId,
      name,
      username,
      email,
      password: hashedPassword,
      approved: false
    }
  }

  try {
    await dynamoDB.put(params).promise();
  
    var transporter = nodemailer.createTransport({
      host: emailHost, // hostname
      secure: false, // TLS requires secureConnection to be false
      port: emailPort, // port for secure SMTP
      auth: {
          user: emailUser,
          pass: emailPw
      },
      tls: {
          ciphers: emailciphers
      }
  });

      // point to the template folder
      const handlebarOptions = {
        viewEngine: {
            partialsDir: path.resolve('./views/'),
            defaultLayout: false,
        },
        viewPath: path.resolve('./views/'),
      };

    // use a template file with nodemailer
    transporter.use('compile', hbs(handlebarOptions))


    var mailOptions = {
      from: `"Admin" <${emailUser}>`, // sender address
      to: adminUser, // list of receivers
      subject: 'New User account request',
      template: 'emailregister', // the name of the template file i.e email.handlebars
      context:{
        userId: userId, 
        name:  name,
        email: email,
        username: username
      }
    };

  


    // trigger the sending of the E-mail
    transporter.sendMail(mailOptions, function(error, info){
      if(error){
          console.log("Error sending email: ", error)
          return console.log(error);
      }
      console.log('Message sent: ' + info.response);
    });

 

    res.status(200).send({ msg: 'Thank you for registering an account! Please wait for admin approval.' });
    console.log("Registration successful. Please wait for admin approval.' ")
  } catch (error) {
    console.error("error"+ error);
    res.status(500).json({ err: 'Registration failed. Please try again later.' });
  }
});


router.get('/notification', (req, res) => {
  const message = req.query.message;
  res.render('notification',{message})
});

router.get('/approve-request/:userId', (req, res) => {

  console.log("approve request")
  const { userId } = req.params;

  console.log("userId:", userId)

  // Check if the user account request exists in the DynamoDB table
  const params = {
    TableName: TableName,
    Key: { 'userId': { S: userId } }
  };

  dyanmodb.getItem(params, (err, data) => {
    console.log(data.Item)
    if (err) {
      console.log(err);
      res.send('Error approving user account request');
    } else if (!data.Item) {
      // The user account request does not exist in the table
      res.send('User account request not found');
    } else if (data.Item.approved.BOOL === true) {
      // The user account request has already been approved
      res.send('User account request already approved');
    } else {
      // Update the user account request status to approved
      const updateParams = {
        TableName: TableName,
        Key: { 'userId': { S: userId } },
        UpdateExpression: 'SET #approved = :val',
        ExpressionAttributeNames: { '#approved': 'approved' },
        ExpressionAttributeValues: { ':val': { BOOL: true } }
      };

      dyanmodb.updateItem(updateParams, (err, data) => {
        if (err) {
          console.log(err);
          res.send('Error approving user account request');
        } else {
          res.send('User account request approved');
        }
      });
    }
  });
});
  

module.exports = router