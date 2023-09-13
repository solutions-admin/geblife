const { Pool } = require('pg');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const sslCert = fs.readFileSync(path.join(__dirname, '.\\certificate.crt'));


// Create a connection pool
const pool = new Pool({
  user: '',
  host: '',
  database: '',
  password: '',
  port: '',
  ssl: {
    rejectUnauthorized: false, // Ignore self-signed certificate error
    ca: sslCert, // Provide the certificate
  }
});


/**********************************************
 * Get Secret Credentials
 * ***********************************************/
const getSecretsValues = require("../middleware/getSecrets.js")

var region,dbHost,dbPort, database = ''

const initialize = async () => {

  try {
      const secretObject = await getSecretsValues();
      pool.options.host = secretObject.dbHost
      pool.options.port = secretObject.dbPort
      pool.options.database = secretObject.dbName

      region= secretObject.region
      accessKeyId = secretObject.accessKeyId
      secretAccessKey = secretObject.secretAccessKey

      AWS.config.update({
        region: region,
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
      });

  } catch(error){

  }
};

//Initialize variables
initialize().then(() => {

  // Function to retrieve database credentials from AWS Secrets Manager
    async function getDatabaseCren() {
      const secretsManager = new AWS.SecretsManager();
      
      try {
        const secretData = await secretsManager.getSecretValue({ SecretId: 'rds!db-0a2be95e-7c41-4aaf-a751-b87984715b3d' }).promise();
        const secretObject = JSON.parse(secretData.SecretString);
        return secretObject
      } catch (error) {
        console.error('Error retrieving database credentials:', error);
        throw error;
      }
    }

  // Initialize the database connection
  (async () => {
    try {
      var dbCredentials = await getDatabaseCren();
      var dbPassword = dbCredentials.password
      var dbUser = dbCredentials.username

      
      pool.options.password = dbPassword;
      pool.options.user = dbUser;


      // console.log(pool);



      console.log('Database connection pool initialized');
    } catch (error) {
      console.error('Error initializing database connection pool:', error);
    }
  })();

}).catch((error) => {
  console.error('Error in initialization:', error);
});


module.exports = pool;
