require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 3000;

const app = express();

// Middlewire
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@crudcluster.buy7rkc.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority&appName=crudCluster`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
    const assignmentCollections = client
      .db(process.env.MONGO_DB)
      .collection("assignments");

    app.get("/", async (req, res) => {
      res.send("Server is running");
    });

    app.post("/assignments", (req, res) => {
      const assignment = req.body;
      console.log(assignment);
      res.send("Send");
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
    app.listen(port, () => {
      console.log(`App listening on port ${port}`);
    });
  }
}
run().catch(console.dir);
