const express = require('express');
const cors = require('cors');
const PORT = process.env.PORT || 5000;
require('dotenv').config();
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hola, The MediTicket Server is on track!');
});

// MongoDB Integrations
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.63zdo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        const database = client.db('MediTicket');
        const RegNo = database.collection('RegNo');
        const RegNoList = await RegNo.find().toArray();
        const CurrentRegNo = RegNoList[RegNoList.length - 1];
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(PORT);