const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const res = require('express/lib/response');
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 5000
const app = express();
require('dotenv').config();

//middleware
app.use(cors());
app.use(express.json());


function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err){
            return res.status(403).send({message: 'forbidden access'});
        }
        console.log('decoded', decoded)
        req.decoded = decoded;
        next()
    })
    console.log('inside verifyJwt', authHeader)
   
}



const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.mvr7c.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db("geniusUser").collection("service");
        const orderCollection = client.db("geniusUser").collection("order");

        //Auth
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            })
            res.send({ accessToken })
        })


        //Service api
        app.get('/service', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })

        // POST
        app.post('/service', async (req, res) => {
            const newService = req.body;
            const result = await serviceCollection.insertOne(newService);
            res.send(result);
        })

        //DELETE 
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        });


        // order api

        app.get('/order', verifyJwt, async (req, res) => {
            const decodedEmail = req.decoded.email;

            const email = req.query.email;
            console.log(email)
            if (email === decodedEmail) {
                const query = { email: email }
                const cursor = orderCollection.find(query)
                const result = await cursor.toArray()
                res.send(result)
            }
            else{
                res.status(403).send({message: 'forbidden access'});
            }
        })

        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result)
        })

    }

    finally {

    }

}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("Running Genius Server")
})

app.listen(port, () => {
    console.log('Listening to port', port)
})

