const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://localhost:27017/hoodly');
  try {
    const db = mongoose.connection.db;

    console.log('--- USERS ---');
    const users = await db.collection('users').find({}).toArray();
    users.forEach(u => {
      console.log(`User: ${u.name} (${u.email}) | ID: ${u._id} | Points: ${u.points}`);
    });

    console.log('\n--- CONTRACTS ---');
    const contracts = await db.collection('contracts').find({}).toArray();
    for (const c of contracts) {
      console.log(`Contract: "${c.title}"`);
      console.log(`  ID: ${c._id}`);
      console.log(`  Status: ${c.status}`);
      console.log(`  Client: ${c.clientId} (Signed: ${c.clientSignature?.signed})`);
      console.log(`  Provider: ${c.providerId} (Signed: ${c.providerSignature?.signed})`);
      console.log(`  Points: ${c.pricePoints} | Escrowed: ${c.pointsEscrowed}`);
      console.log(`  Service ID: ${c.serviceId}`);
      console.log(`  Template Doc: ${c.templateDocumentId}`);
      console.log(`  Signed Doc: ${c.signedDocumentId}`);
    }

    console.log('\n--- CONVERSATIONS ---');
    const conversations = await db.collection('conversations').find({}).toArray();
    for (const conv of conversations) {
      if (conv.serviceId) {
        console.log(`Conversation ID: ${conv._id}`);
        console.log(`  Service ID: ${conv.serviceId}`);
        console.log(`  Prestation Statut: ${conv.prestationStatut}`);
        console.log(`  Créneau Statut: ${conv.creneau?.statut} (Date: ${conv.creneau?.date}, debut: ${conv.creneau?.debut}, fin: ${conv.creneau?.fin})`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

main();
