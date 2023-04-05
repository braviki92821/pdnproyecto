var clientModel = require('../model/client');

async function getClient (clientId){
    let client = await clientModel.findOne({clientId: clientId},{"_id":0}).exec();
    //let clientes= await clientModel.find().exec();
    return client;
}

module.exports.getClient = getClient;




