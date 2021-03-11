const AWS = require("aws-sdk");
const fs = require('fs');

AWS.config.update({
    region: "us-east-1",
   
});
var docClient = new AWS.DynamoDB.DocumentClient();

async function push(data){
    try{
        
        // var docClient = new AWS.DynamoDB.DocumentClient();
        var datetime = new Date();
        if(data && data.length > 0){
            console.log("Importing messages into DynamoDB. Please wait.");
            for(index in data){
                data[index].partition_time = datetime.toISOString().slice(0,10)
                var params = {
                    TableName: "messages",
                    Item: data[index]
                }
                await docClient.put(params).promise()
            }     
        }
    }catch(err){
        console.error(" erro occured while storing the data to DB " + err)
        
    }
    return null;
}

async function pushMsgGroupCount(data, tableName){
    try{
    var datetime = new Date();
    if(data && tableName){
        console.log("Importing messages frequency into DynamoDB. Please wait.");
        data.partition_time = datetime.toISOString().slice(0,13);
        var params = {
            TableName: tableName,
            Item: data
        }
        await docClient.put(params).promise()
    }
}catch(err){
    console.log("erro occured while storing the data to DB" + err);
}

}

module.exports = {push, pushMsgGroupCount}