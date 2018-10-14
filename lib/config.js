
var environments = {};

environments.staging = {
    'httpPort' : 3000,
    'envName' : 'staging',
    'hashingSecret' : 'thisIsASecret',
    'stripeKey' : 'STRIPEAPIKEY',
    'mailgun': {
        'sender' : 'MAILID',
        'apiKey' : 'STRIPEAPIKEY',
        'domainName' : 'MAILGUNAPIKEY'
    }

};

var currentEnv = typeof process.env.NODE_ENV == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

var envToExport = typeof environments[currentEnv] == 'object' ? environments[currentEnv] : environments.staging;

module.exports = envToExport;

