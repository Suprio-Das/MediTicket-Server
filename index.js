const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const PORT = process.env.PORT || 5000;
require('dotenv').config();
const app = express();
let checked = 0;

// Middlewares
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hola, The MediTicket Server is on track!');
});

// MongoDB Integrations
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const Rooms = database.collection('Rooms');
        const Tickets = database.collection('Tickets');

        // Getting Current Date
        const d = new Date();
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const fullDate = `${year}-0${month}-${day}`;

        const updateRoomCapcity = async () => {
            const update = {
                $set: {
                    Medicine: 50,
                    Skin: 50,
                    Eye: 50,
                    Dental: 50,
                    Dialysis: 50,
                    NeuroMedicine: 50,
                    Date: fullDate
                }
            }
            const result = await Rooms.updateMany({}, update);
            console.log(result);
        }

        // Schedule Room Capcity Reset at 12:01 midnight
        cron.schedule('1 0 * * *', () => {
            updateRoomCapcity();
        });

        app.get('/test-reset', async (req, res) => {
            await updateRoomCapcity();
            res.send('Manual reset complete');
        });


        // Room API
        app.get('/rooms', async (req, res) => {
            const result = await Rooms.find().toArray();
            res.send(result);
        })

        // Update Room Capacity
        app.put('/rooms', async (req, res) => {
            const data = req.body;
            const rooms = await Rooms.find().toArray();
            const room = rooms[0];
            const query = { _id: new ObjectId(room._id) };
            const result = await Rooms.updateOne(query, { $set: data });
            res.send(result);
        })

        // New Ticket API
        app.post('/tickets', async (req, res) => {
            const RegNoList = await RegNo.find().toArray();
            const lastRegNo = RegNoList[RegNoList.length - 1];
            const CurrentRegNoString = lastRegNo.regNo;
            const CurrentRegNo = parseInt(CurrentRegNoString);
            const UpdatedRegNo = CurrentRegNo + 1;
            const newTicket = req.body;
            newTicket.regNo = UpdatedRegNo;
            const finalRegNo = {
                regNo: UpdatedRegNo
            }
            // Add new reg no
            const newRegNo = await RegNo.insertOne(finalRegNo);
            const result = await Tickets.insertOne(newTicket);
            if (result.insertedId) {
                // Fetching the generated ticket
                const newTicketQuery = { _id: new ObjectId(result.insertedId) }
                const generatedTicket = await Tickets.findOne(newTicketQuery);
                res.send(generatedTicket);
            }
        })

        // Verfication Route
        app.get('/verification', async (req, res) => {
            const regNo = parseInt(req.query.regno);
            const query = { regNo: regNo };
            const result = await RegNo.findOne(query);
            console.log(result);
            res.send(result);
        })

    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(PORT);