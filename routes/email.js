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
router.get('/sendEmail', setCurrentPage('/sendEmail'),auth, (req, res) => {
    console.log("Inside Home")
    req.session.currentpage = '/sendEmail';
    console.log(req.session)
    user = req.session.userFullName

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

    var emailRecipients = []
    var customerFullNames =[]

    // Create an array to store the results of each email sent
    const emailResults = [];

    // Check if emailRecipient is empty or null
    if (emailRecipient == "" || emailRecipient == null) {
      let query = 'SELECT first_name, last_name, email FROM geblife.customer WHERE subscription_status <> false';
      console.log("Query: ", query);

      try {
        const client = await pool.connect();
        const result = await client.query(query);
        client.release();

        const customerInfo = result.rows;
        console.log(customerInfo);

        // const emailRecipients = [];
        // const customerFullNames = [];

        for (let i = 0; i < customerInfo.length; i++) {
          const customerEmail = customerInfo[i].email;
          const customerFullName = customerInfo[i].first_name + " " + customerInfo[i].last_name;
          emailRecipients.push(customerEmail);
          customerFullNames.push(customerFullName);
        }

        console.log(emailRecipients);
        console.log(customerFullNames);

      } catch (error) {
        console.error('Error retrieving customer details:', error);
        res.json({ error: `Error retrieving customer details:, ${error}`});
        return;

      }
    } else {
      // If emailRecipient is provided, convert it to an array
      emailRecipients = await convertToArray(emailRecipient);
      console.log(emailRecipients);
    }

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

    console.log(emailRecipients.length)
    console.log(customerFullNames.length)

  // Check if the lengths of emailRecipients and customerFullNames are the same
  if (emailRecipients.length === customerFullNames.length) {
    for (let i = 0; i < emailRecipients.length; i++) {
      console.log(`Customer Full Name ${i}: ${customerFullNames[i]}`);
      console.log(`Email ${i}: ${emailRecipients[i]}`);

      const mailOptions = {
        from: emailUser,
        to: emailRecipients[i],
        subject: subject,
        template: `emailtemplate${emailTemplate}`,
        context: {
          emailSalutation: emailSalutation + " " + customerFullNames[i] + ",",
          emailBody: emailBody
        }
      };

      // Send the email
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: ' + info);
        emailResults.push({
                Email: emailRecipients[i],
                Customer: customerFullNames[i],
                Status: 'success',
                Reason: ''
        });
      } catch (error){
          console.log("Error sending email: ", error);
          emailResults.push({
              Email: emailRecipients[i],
              Customer: customerFullNames[i],
              Status: 'failed',
              Reason: error.message
          });
      }
        
    }

  } else {
    for (let i = 0; i < emailRecipients.length; i++) {
      console.log(`Email ${i}: ${emailRecipients[i]}`);

      const mailOptions = {
        from: `"Geblife Management" <${emailUser}>`,
        to: emailRecipients[i],
        subject: subject,
        template: `emailtemplate${emailTemplate}`,
        context: {
          emailSalutation: emailSalutation,
          emailBody: emailBody
        }
      };

      // Send the email
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: ' + info);
        emailResults.push({
                Email: emailRecipients[i],
                Customer: "",
                Status: 'success',
                Reason: ''
        });
      } catch (error){
          console.log("Error sending email: ", error);
          emailResults.push({
              Email: emailRecipients[i],
              Customer: "",
              Status: 'failed',
              Reason: error.message
          });
      }
    
    }

   
  }

  console.log(emailResults)
  res.status(200).json({ message: 'Emails sent!', emailResults });
} catch (error) {
  console.error("error" + error);
  res.json({ error: `Sending Email failed. Error: ${error}. Please try again later.` });
}

});

// Request to render edit customer page
router.get("/editCustomer", setCurrentPage('/editCustomer'), auth, (req, res) => {

  console.log("Inside Customer")
  req.session.currentpage = '/editCustomer';
  console.log(req.session)
  user = req.session.userFullName
  

  res.render("editCustomer", {user})
});


// Request to retrieve customer details from database
router.post("/customer", async (req, res) => {
  const filter = req.body; // Get the filter criteria from the client

  let query = 'SELECT * FROM geblife.customer WHERE 1=1'; // Initial query

  const values = []; // Array to store parameterized values

  // Build the SQL query dynamically based on the filter criteria
  if (filter.first_name) {
    query += ' AND first_name LIKE $1';
    values.push(`%${filter.first_name}%`);
  }

  if (filter.last_name) {
    query += ' AND last_name LIKE $2';
    values.push(`%${filter.last_name}%`);
  }

  if (filter.email) {
    query += ' AND email LIKE $3';
    values.push(`%${filter.email}%`);
  }

  if (filter.subscription_status) {
    query += ' AND subscription_status=$4';
    values.push(`${filter.subscription_status}`);
  }

  

  console.log(values)



  console.log("Query: ", query)

  try {
    const client = await pool.connect();
    const result = await client.query(query, values);
    client.release();

    const customerItems = result.rows;
    console.log("Filtered customer items:");
    console.log(customerItems);
    res.json(customerItems);
  } catch (error) {
    console.error('Error retrieving filtered customer items:', error);
    res.status(500).json({ success: false, error: `Error retrieving filtered customer items: ${error}` });
  }
});

// Insert an item into the customer table
router.post('/insertCustomer', async (req, res) => {
  console.log('Received POST request to /insertCustomer');
  const newCustomer = req.body;
  console.log(newCustomer)
  console.log(newCustomer.subscription_status)


  try {
    const result = await pool.query(
      'INSERT INTO geblife.customer (first_name, last_name, email, subscription_status) VALUES ($1, $2, $3, $4) RETURNING id',
      [newCustomer.first_name, newCustomer.last_name, newCustomer.email, newCustomer.subscription_status]
    );

    
    res.json({ success: true, message: ` Customer: (${newCustomer.first_name} ${newCustomer.last_name}) Info Added`, insertedItemId: result.rows[0].id });
  } catch (error) {
    console.error('Error inserting item:', error);
    res.status(500).json({ success: false, error: `Error inserting item: ${error}`});
  }
});

// Update an item in the customer table
router.post('/updateCustomer', async (req, res) => {
  const updatedCustomer = req.body;

  console.log(updatedCustomer)

  try {
    await pool.query(
      'UPDATE geblife.customer SET first_name = $1, last_name = $2, email =$3, subscription_status= $4 WHERE id = $5',
      [updatedCustomer.first_name, updatedCustomer.last_name, updatedCustomer.email,  updatedCustomer.subscription_status, updatedCustomer.id]
    );

    res.json({ success: true, message: `Customer: (${updatedCustomer.first_name} ${updatedCustomer.last_name}) Info Updated` });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ success: false, error: `Error updating item: ${error}` });
  }
});

// Delete an item from the customer table
router.post('/deleteCustomer', async (req, res) => {
  const itemId = req.body.id;
  const customerName = req.body.first_name + " " + req.body.last_name;

  try {
    await pool.query('DELETE FROM geblife.customer WHERE id = $1', [itemId]);
    res.json({ success: true, message: `Customer (${customerName}) info deleted` });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ success: false, error: `Error deleting item: ${error}` });
  }
});



router.get('/template', (req, res) => {
  const url = req.query;
  var emailSalutation = url.emailSalutation;
  var emailBody= url.emailBody;
  console.log(url)
  res.render(`emailtemplate${url.emailTemplate}`,{emailSalutation,emailBody})
})

// router.get('/unsubscribe/:userId', (req, res) => {

//   console.log("Unsubscibe user")

//   const updatedCustomer = req.body;

//   console.log(updatedCustomer)

//   try {
//     await pool.query(
//       'UPDATE geblife.customer SET first_name = $1, last_name = $2, email =$3, subscription_status= $4 WHERE id = $5',
//       [updatedCustomer.first_name, updatedCustomer.last_name, updatedCustomer.email,  updatedCustomer.subscription_status, updatedCustomer.id]
//     );

//     res.json({ success: true, message: `Customer: (${updatedCustomer.first_name} ${updatedCustomer.last_name}) Info Updated` });
//   } catch (error) {
//     console.error('Error updating item:', error);
//     res.status(500).json({ success: false, error: `Error updating item: ${error}` });
//   }





// });



module.exports = router