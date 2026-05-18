const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app=express();
const port = process.env.PORT || 5000

// middleware
app.use(express.json())
app.use(cors());






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PSS}@cluster0.mndvni1.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const database = client.db('ideas-vault');
        const ideasColl= database.collection('ideas')
       

        // get all ideas
        app.get('/ideas',async(req,res)=>{
            const result = await ideasColl.find().toArray();
            res.send(result);
        })
        // get only 6 ideas data
        app.get('/featured-ideas',async(req,res)=>{
            const result = await ideasColl.find().limit(6).toArray();
            res.send(result)
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/',(req,res)=>{
 res.send('server is getting hot')
})


app.listen(port,()=>{
    console.log(`server in running in ${port}`);
    
})