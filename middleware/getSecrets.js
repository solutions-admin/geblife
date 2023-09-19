const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// const sslCert = fs.readFileSync(path.join(__dirname, '.\\certificate.crt'));


// Load AWS credentials from environment variables or a configuration file
AWS.config.update({
  region: 'us-east-1',
  accessKeyId: 'AKIA6MKH7SAQLRUFA6XS',
  secretAccessKey: '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'
});


// Function to retrieve database password from AWS Secrets Manager
async function getSecretsValues() {
  const secretsManager = new AWS.SecretsManager();
  
  try {
    const secretData = await secretsManager.getSecretValue({ SecretId: 'app/credentials' }).promise();
    const secretObject = JSON.parse(secretData.SecretString);
    
    return secretObject;
  } catch (error) {
    console.error('Error retrieving secret credentials:', error);
    throw error;
  }
}



module.exports = getSecretsValues;
