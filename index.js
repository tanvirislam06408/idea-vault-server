const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
require('dotenv').config()
const app = express();
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


const JWKS = createRemoteJWKSet(
    new URL('http://localhost:3000/api/auth/jwks')
)

//  verify the jwt token

const verifyToken = async(req, res, next) => {
    const tokenHeader = req.headers.authorization;
    if (!tokenHeader) {
        return res.status(401).send({ message: 'Unauthorized' })
    }

    const token = tokenHeader.split(" ")[1]
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized' })
    }
    try{
            const { payload } = await jwtVerify(token, JWKS)
            next()
    }
    catch(error){
        return res.status(403).send({ message: 'Forbidden' })
    }


}


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const database = client.db('ideas-vault');
        const ideasColl = database.collection('ideas')
        const commentsColl = database.collection('comments')


        // get all ideas
        app.get('/ideas', async (req, res) => {
            const result = await ideasColl.find().toArray();
            res.send(result);
        })

        // delete idea
        app.delete('/ideas/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            }

            const result = await ideasColl.deleteOne(query);
            res.send(result);
        })

        // get single idea
        app.get('/ideas/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            }
            const result = await ideasColl.findOne(query);
            res.send(result)
        })

        // update idea 
        app.patch('/ideas/:id', async (req, res) => {
            const id = req.params.id;
            const updatedIdea = req.body;


            const updatedDoc = {
                $set: updatedIdea
            }
            const filter = {
                _id: new ObjectId(id)
            };
            const result = await ideasColl.updateOne(filter, updatedDoc);
            res.send(result)
        })

        // get only 6 ideas data
        app.get('/featured-ideas', async (req, res) => {
            const result = await ideasColl.find().limit(6).toArray();
            res.send(result)
        })


        // post ideas in db
        app.post('/ideas',verifyToken, async (req, res) => {
            const data = req.body;
            const result = await ideasColl.insertOne(data);
            res.send(result);

        })

        // load user ideas
        app.get('/userIdea/:id',verifyToken, async (req, res) => {
            const id = req.params.id;

            const query = {

                'author.user_id': id
            }
            const result = await ideasColl.find(query).toArray();
            res.send(result)
        })

        // comments on post

        app.post('/comments', async (req, res) => {
            const data = req.body
            const result = await commentsColl.insertOne(data);
            res.send(result)
        })

        //  get all comments
        app.get('/comments/:id', async (req, res) => {
            const id = req.params.id
            const query = {
                'post_id': id
            }
            const result = await commentsColl.find(query).toArray();
            res.send(result)
        })

        // update comment
        app.patch('/comment/:id', async (req, res) => {
            const id = req.params.id;
            const comment = req.body;
            const query = {
                _id: new ObjectId(id)
            }
            const updatedDoc = {
                $set: comment
            }
            const result = await commentsColl.updateOne(query, updatedDoc);
            res.send(result);
        })

        // get a user interactions

        app.get('/interactions/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = {
                'posted_by': id
            }
            const result = await commentsColl.find(query).toArray();
            res.send(result);
        })


        //delete ideas
        app.delete('/comments/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            }
            const result = await commentsColl.deleteOne(query);
            res.send(result)
        })

        // patch the idea like
        app.patch('/ideas-like/:id', async (req, res) => {
            const id = req.params.id
            const filter = {
                _id: new ObjectId(id)
            }
            const updatedDoc = {

                $inc: {
                    'engagement.likes': 1
                }
            }

            const result = await ideasColl.updateOne(filter, updatedDoc);
            res.send(result)
        })


        app.get('/searchIdea', async (req, res) => {
            const { search, sort, category } = req.query;

            const query = {

            }

            if (search) {
                query.project_title = {
                    $regex: search,
                    $options: 'i'
                }
            }

            if (category) {
                query['metadata.category'] = category
            }


            // sorting

            let sortOption = {};
            if (sort === 'newToOld') {
                sortOption = { 'author.posted_date': -1 };
            } else if (sort === 'oldToNew') {
                sortOption = { 'author.posted_date': 1 };
            }




            const result = await ideasColl.find(query).sort(sortOption).toArray();
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





app.get('/', (req, res) => {
    res.send('server is getting hot')
})


app.listen(port, () => {
    console.log(`server in running in ${port}`);

})