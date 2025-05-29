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
        const Rooms = database.collection('Rooms');
        const RegNoList = await RegNo.find().toArray();
        const CurrentRegNo = RegNoList[RegNoList.length - 1];

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

        // Room API
        app.get('/rooms', async (req, res) => {
            const result = await Rooms.find().toArray();
            res.send(result);
        })

        // Update Room Capacity
        app.put('/rooms', async (req, res) => {
            const data = req.body;
            console.log(data);
        })

        // New Ticket API
        app.post('/tickets', async (req, res) => {
            const newTicket = req.body;
            const room = newTicket.room;
            const roomName = room[room.length - 1];
            const query = { Medicine: '50' };
            if (roomName === 'M') {
                const currentMedicineRoom = await Rooms.findOne(query);
                console.log(currentMedicineRoom);
            }
        })

    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(PORT);