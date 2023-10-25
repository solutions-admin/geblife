var express = require('express');
const router = express.Router()
router.use(express.json());


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
 * Get Secret Credentials
 * ***********************************************/
const getSecretsValues = require("../middleware/getSecrets.js")

var emailUser, emailPw, adminUser, region,accessKeyId,secretAccessKey, UserAccountTableName,emailciphers,emailPort, emailHost, s3accessKeyId,s3secretAccessKey,s3Bucket = ''

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
    s3accessKeyId = secretObject.s3accessKeyId
    s3secretAccessKey = secretObject.s3secretAccessKey
    s3Bucket = secretObject.s3Bucket

  }).catch((error) => {
    // Handle any errors that occurred during retrieval
    console.error('Error retrieving secret credentials:', error);
});


// Render to view Inventory
router.get('/resmgt', setCurrentPage('/resmgt'), auth,(req, res) => {
    console.log("Inside Resource Management")
    req.session.currentpage = '/resmgt';
    console.log(req.session)
    user = req.session.userFullName
    
    res.render("resource_management", {user,s3accessKeyId,s3secretAccessKey,s3Bucket })
})


module.exports = router