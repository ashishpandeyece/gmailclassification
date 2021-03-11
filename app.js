// const axios = require('/gmailapi')
const gmail = require('./gmailapi')
const util = require('util');
let Q = require('q')
// const url = 'http://checkip.amazonaws.com/';
let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context) => {
    var deferred = Q.defer();
    try {
        // const ret = await axios(url);
        console.log("welcome Atul");
        //var processMail = util.promisify(gmail.processMail());
        //deferred.resolve(gmail.processMail())
        await gmail.processMail()
        
    } catch (err) {
        console.log(err);
        //deferred.reject(new Error(err));
        //return err;
    }
    
    finally{
        console.log("finally block")
    }
    return deferred.promise;
};

exports.lambdaHandler();

