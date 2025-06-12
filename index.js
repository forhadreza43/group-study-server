require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const assignmentCollections = client
      .db(process.env.MONGO_DB)
      .collection("assignments");

    app.get("/", async (req, res) => {
      res.send("Server is running");
    });

    app.post("/assignments", async (req, res) => {
      const assignment = req.body;
      try {
        const result = await assignmentCollections.insertOne(assignment);
        res.send({
          success: true,
          message: "Assignment created successfully",
          insertedId: result.insertedId,
        });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    app.get("/assignments", async (req, res) => {
      const { difficulty, search } = req.query;

      const filter = {};

      if (difficulty) {
        filter.difficulty = difficulty;
      }

      if (search) {
        filter.title = { $regex: search, $options: "i" };
      }

      try {
        const result = await assignmentCollections.find(filter).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });
    

    app.get("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const assignment = await assignmentCollections.findOne({
          _id: new ObjectId(id),
        });

        if (!assignment) {
          return res
            .status(404)
            .send({ success: false, message: "Assignment not found" });
        }
        res.send(assignment);
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    app.put("/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      try {
        const result = await assignmentCollections.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              title: updatedData.title,
              description: updatedData.description,
              marks: updatedData.marks,
              thumbnail: updatedData.thumbnail,
              difficulty: updatedData.difficulty,
              dueDate: updatedData.dueDate,
            },
          }
        );

        if (result.modifiedCount > 0) {
          res.send({
            success: true,
            message: "Assignment updated successfully",
          });
        } else {
          res
            .status(400)
            .send({ success: false, message: "Nothing was updated" });
        }
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });
    
    app.delete("/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const email = req.query.email;

      try {
        const assignment = await assignmentCollections.findOne({
          _id: new ObjectId(id),
        });

        if (!assignment) {
          return res
            .status(404)
            .send({ success: false, message: "Assignment not found" });
        }

        if (assignment.creator?.email !== email) {
          return res.status(403).send({
            success: false,
            message: "You are not authorized to delete this assignment.",
          });
        }

        const result = await assignmentCollections.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount > 0) {
          res.send({ success: true });
        } else {
          res
            .status(500)
            .send({ success: false, message: "Delete failed internally." });
        }
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    app.get("/submitted-assignments", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "Email is required" });

      try {
        const submissions = await client
          .db(process.env.MONGO_DB)
          .collection("submittedAssignments")
          .find({ userEmail: email })
          .toArray();

        res.send(submissions);
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });
    
    app.post("/submitted-assignments", async (req, res) => {
      const data = req.body;
      try {
        const result = await client
          .db(process.env.MONGO_DB)
          .collection("submittedAssignments")
          .insertOne({ ...data, status: "pending", submittedAt: new Date() });

        res.send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    app.patch("/submitted-assignments/:id", async (req, res) => {
      const id = req.params.id;
      const { obtainedMarks, feedback } = req.body;

      try {
        const result = await client
          .db(process.env.MONGO_DB)
          .collection("submittedAssignments")
          .updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                obtainedMarks,
                feedback,
                status: "completed",
                markedAt: new Date(),
              },
            }
          );

        res.send({ success: true, modifiedCount: result.modifiedCount });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });
    
    
    app.get("/pending-submitted-assignments", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res
          .status(400)
          .send({ success: false, message: "Email is required" });
      }

      try {
        const submissions = await client
          .db(process.env.MONGO_DB)
          .collection("submittedAssignments")
          .find({ status: "pending", userEmail: { $ne: email } }) // exclude self
          .toArray();

        res.send(submissions);
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });
    
  } finally {
    app.listen(port, () => {
      console.log(`App listening on port ${port}`);
    });
  }
}
run().catch(console.dir);
