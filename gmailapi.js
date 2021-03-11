
const dao = require('./dao')
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
let Q = require('q');
const { count } = require('console');
//const app = require('express')
// If modifying these scopes, delete token.json.
const SCOPES = ['https://mail.google.com/'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
// Table name
const tableName = 'messages';

var msg_freq = {};

// Load client secrets from a local file.
function processMail() {
  var deferred = Q.defer();
  console.log("new gmail api")
  fs.readFile('credentials.json', (err, content) => {
    if (err) {
      console.log('Error loading client secret file:', err)
      deferred.reject(new Error(err))
      //return console.log('Error loading client secret file:', err);
    } else {
      console.log("process mail else block")
      // Authorize a client with credentials, then call the Gmail API.
      //authorize(JSON.parse(content), listLabels);
      deferred.resolve(authorize(JSON.parse(content), listLabels))
    }

  });
  return deferred.promise;
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var deferred = Q.defer();
  try {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);
    console.log("authorizefunction call")
    // Check if we have previously stored a token.
    deferred.resolve(fs.readFile(TOKEN_PATH, (err, token) => {
      var deferred = Q.defer();
      if (err) {
        //return getNewToken(oAuth2Client, callback);
        deferred.reject(getNewToken(oAuth2Client, callback));
      } else {
        //token = "4/1AY0e-g7uvurmfsb1Xt8IMI0Y2MS6ld8ZCiB3Qke-2OzKYjCmA7bZxvV5qk8";
        oAuth2Client.setCredentials(JSON.parse(token));
        //oAuth2Client.setCredentials(token);
        deferred.resolve(callback(oAuth2Client));
      }
      return deferred.promise;
    }));
  }
  catch (err) {
    console.log("exception occurs in aurhorise")
    deferred.reject(new Error(err))
  }
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
  msg_freq = {
    "FROM_GMAIL": 0,
    "FROM_OTHER": 0,
    "TO_GMAIL" : 0,
    "TO_OTHER" : 0
  };
  msg_freq.id = new Date().getTime();
  var deferred = Q.defer();
  var labels = ["INBOX", "SENT"];
  for (label in labels) {
    const gmail = google.gmail({ version: 'v1', auth });
    gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
      labelIds: labels[label]
    }, (err, res) => {

      if (err) {
        console.log('The API returned an error: ' + err)
        deferred.reject(new Error(err))
      }
      else {
        //deferred.resolve(processMailList(auth,res,gmail));
        processMailList(auth, res, gmail);
      }
      return deferred.promise;
    });
  }
}

async function processMailList(auth, res, gmail) {
  //var deferred = Q.defer();

  try {
    if (!res.data || !res.data.messages) {
      var err = " No result found";
      console.log(err)

    }
    else {
      var count = res.data.messages.length;
      //deferred.resolve(processMailById(auth,res,gmail,count));
      await countMailGroups(auth, res, gmail, count)
    }
  } catch (err) {
    console.log(err);
    deferred.reject(new Error(err));
  }
  //return deferred.promise;
}

function countMailGroups(auth, res, gmail, count) {
  var deferred = Q.defer();
  var msg = res.data.messages;
  var index = 0;
  var messages = [msg.length];
  if (msg.length) {
    msg.forEach((msg) => {

      var deferred = Q.defer()
      gmail.users.messages.get({ auth: auth, userId: 'me', 'id': msg.id }, function (err, response) {

        if (err) {
          console.log('The API returned an error: ' + err)
          deferred.reject(new Error(err));
          return;
        }

        var messageObj = {}

        if (!response['data']) {
          console.log("message data is null")
          deferred.reject(new Error(err))
        }
        //messageObj.body = response.data.snippet;
        //messageObj.message_id = response.data.id
        
        if (response.data.payload && response.data.payload.headers) {

          if (response.data.labelIds.includes("INBOX")) {
            messageObj.msg_label = "INBOX";
          }
          else if (response.data.labelIds.includes("SENT")) {
            messageObj.msg_label = "SENT";
          }
          var header = response.data.payload.headers;
          for (prop in header) {
            // if(header[prop].name == 'Subject' || header[prop].name == 'subject')
            //   messageObj.subject = header[prop].value;
            if (header[prop].name == 'From' || header[prop].name == 'from')
              messageObj.from = header[prop].value;
            if (header[prop].name == 'To' || header[prop].name == 'to')
              messageObj.to = header[prop].value;
            // if(header[prop].name == 'Content-Type' || header[prop].name == 'content-type')
            //   messageObj.contentType = header[prop].value;
          }
        }


        if (messageObj.msg_label == 'INBOX') {
          if (messageObj.from.toLowerCase().includes("gmail") || messageObj.from.toLowerCase().includes('google')) {
            //messageObj.group = "FROM_GMAIL"
            msg_freq.FROM_GMAIL = parseInt(msg_freq.FROM_GMAIL) + 1;
          }
          else {
            //messageObj.group = "FROM_OTHER";
            msg_freq.FROM_OTHER = parseInt(msg_freq.FROM_OTHER) + 1;
          }
        }
        else if (messageObj.msg_label == 'SENT') {
          if (messageObj.to.toLowerCase().includes("gmail") || messageObj.to.toLowerCase().includes('google')) {
            messageObj.group = "TO_GMAIL";
            msg_freq.TO_GMAIL = parseInt(msg_freq.TO_GMAIL) + 1;
          }
          else {
            messageObj.group = "TO_OTHER";
            msg_freq.TO_OTHER = parseInt(msg_freq.TO_OTHER) + 1;
          }
        }
        console.log(messageObj);
        
        //console.log("previous count " + index)
        messages[index] = messageObj;
        index = index + 1;
        console.log(" count index " + index + " msg_length " + count)

        if (index == count) {
          console.log("job done successfully  " + messages.length)
          //deferred.resolve(populateMsgFreq(messages));
          
          deferred.resolve(dao.pushMsgGroupCount(msg_freq, tableName))
          //deferred.resolve(console.log("data pushed successfully"))
        }
      });
    });
  }
}

function populateMsgFreq(messageObj) {

}

function processMailById(auth, res, gmail, count) {

  var deferred = Q.defer();
  try {
    var msg = res.data.messages;
    var index = 0;
    var messages = [msg.length];
    if (msg.length) {
      msg.forEach((msg) => {
        //console.log(`- ${label.name}`);

        // Get the message id which we will need to retreive tha actual message next.


        var deferred = Q.defer();
        // Retreive the actual message using the message id
        gmail.users.messages.get({ auth: auth, userId: 'me', 'id': msg.id }, function (err, response) {

          if (err) {
            console.log('The API returned an error: ' + err)
            deferred.reject(new Error(err));
            return;
          }

          var messageObj = {}

          if (!response['data']) {
            console.log("message data is null")
            deferred.reject(new Error(err))
          }
          messageObj.body = response.data.snippet;
          messageObj.message_id = response.data.id
          if (response.data.payload && response.data.payload.headers) {

            if (response.data.labelIds.includes("INBOX")) {
              messageObj.msg_label = "INBOX";
            }
            else if (response.data.labelIds.includes("SENT")) {
              messageObj.msg_label = "SENT";
            }
            var header = response.data.payload.headers;
            for (prop in header) {
              if (header[prop].name == 'Subject' || header[prop].name == 'subject')
                messageObj.subject = header[prop].value;
              if (header[prop].name == 'From' || header[prop].name == 'from')
                messageObj.from = header[prop].value;
              if (header[prop].name == 'To' || header[prop].name == 'to')
                messageObj.to = header[prop].value;
              if (header[prop].name == 'Content-Type' || header[prop].name == 'content-type')
                messageObj.contentType = header[prop].value;
            }
          }


          if (messageObj.msg_label == 'INBOX') {
            if (messageObj.from.toLowerCase().includes("gmail") || messageObj.from.toLowerCase().includes('google')) {
              messageObj.group = "FROM_GMAIL"
            }
            else {
              messageObj.group = "FROM_OTHER";
            }
          }
          else if (messageObj.msg_label == 'SENT') {
            if (messageObj.to.toLowerCase().includes("gmail") || messageObj.to.toLowerCase().includes('google')) {
              messageObj.group = "TO_GMAIL";
            }
            else {
              messageObj.group = "TO_OTHER";
            }
          }
          console.log(messageObj);
          //console.log("previous count " + index)
          messages[index] = messageObj;
          index = index + 1;
          console.log(" count index " + index + " msg_length " + count)

          if (index == count) {
            console.log("job done successfully  " + messages.length)
            deferred.resolve(dao.push(messages))
            //deferred.resolve(console.log("data pushed successfully"))
          }
        });

      });
    } else {
      console.log('No labels found.');
      deferred.reject(new Error("No labels found."));
    }

  } catch (err) {
    console.log("exception occured in mail process mail by id " + err)
    deferred.reject(new Error(err));
  }
  return deferred.promise;
}
var success = function () {
  console.log("job done without error");
}
module.exports = { listLabels, getNewToken, authorize, processMail }