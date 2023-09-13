var express = require('express');
const router = express.Router()
router.use(express.json());


let currentpage = "";
let name = "";

/**********************************************
  ACCESS AND AUTHENTICATION 
 ***********************************************/
const auth = require("../middleware/auth.js")

// Middleware function to set currentpage in session
function setCurrentPage(page) {
  return function (req, res, next) {
    req.session.currentpage = page;
    console.log("Inside set: ", req.session)

    next();

  };
}

/**********************************************
 * Send Email
 * ***********************************************/
const hbs = require('nodemailer-express-handlebars')
const nodemailer = require('nodemailer')
const path = require('path')

/**********************************************
 * Database Connection
 * ***********************************************/
const pool = require("../db/dbConnection.js")


/**********************************************
 * Get Secret Credentials
 * ***********************************************/
const getSecretsValues = require("../middleware/getSecrets.js")

var emailUser, emailPw, adminUser, region,accessKeyId,secretAccessKey, UserAccountTableName,emailciphers,emailPort, emailHost = ''

getSecretsValues().then((secretObject) => {
    //get secretObject
    // console.log(secretObject);
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

  }).catch((error) => {
    // Handle any errors that occurred during retrieval
    console.error('Error retrieving secret credentials:', error);
});




// Render send email page
router.get('/sendEmail', setCurrentPage('/sendEmail'), (req, res) => {
    console.log("Inside Home")
    req.session.currentpage = '/sendEmail';
    console.log(req.session)
    user = req.session.userFullName || "Nana G"

    res.render("sendEmail", {user})
  })


async function convertToArray(value) {
    // Use regular expression to split the string by spaces and commas
    const array = value.split(/[,\s]+/);
    return array;
}

// Post request to send email
router.post('/sendEmail', async (req, res) => {

    const { emailRecipient, subject, emailSalutation, emailBody, emailTemplate} = req.body;
  
    console.log("emailRecipient", emailRecipient)
    console.log("subject", subject)
    console.log("emailSalutation", emailSalutation)
    console.log("emailBody", emailBody)
    console.log("emailTemplate", emailTemplate)

    try {
    
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
  
    // Define the list of email recipients as an array
    const emailRecipients = await convertToArray(emailRecipient);

    console.log(emailRecipients)
    
      var mailOptions = {
        from: `"Admin" <${emailUser}>`, // sender address
        to: emailRecipients.join(', '), // list of receivers
        subject: subject,
        template: `emailtemplate${emailTemplate}`, // the name of the template file i.e email.handlebars
        context:{
          emailSalutation: emailSalutation, 
          emailBody: emailBody
        }
      };
  
      // trigger the sending of the E-mail
      transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log("Error sending email: ", error)
            res.status(500).send({ err: `Sending Email failed. Error: ${error}. Please try again later.` });

        }else{
            console.log('Message sent: ' + info);
            res.status(200).send({ msg: 'Email successfully sent!' });
            console.log('Email successfully sent!')
        }
        
      });
  
   
  
     
    } catch (error) {
      console.error("error"+ error);
      res.status(500).send({ err: `Sending Email failed. Error: ${error}. Please try again later.` });
    }
  });

module.exports = router