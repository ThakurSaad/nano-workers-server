const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(
  "sk_test_51L0k3pBXb2oMSwoOOFy5628JpwJdNvtEhCP9hO3K2TqlVjPcH7iv15BhLwIiFjxi4XiUCHApCK2U7Gts9KnVpy1K00hxRiASsW"
);
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cpypwfl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("Nano DB is real heavy");

    const usersCollection = client.db("nanoDB").collection("users");
    const taskCollection = client.db("nanoDB").collection("tasks");
    const submissionCollection = client.db("nanoDB").collection("submissions");
    const withdrawCollection = client.db("nanoDB").collection("withdraws");
    const paymentCollection = client.db("nanoDB").collection("payments");

    app.get("/taskList", async (req, res) => {
      const taskList = await taskCollection.find().toArray();
      res.send(taskList.reverse());
    });

    app.get("/task/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const task = await taskCollection.findOne({
          _id: ObjectId.createFromHexString(id),
        });
        res.send(task);
      } catch (err) {
        res.send({ error: err.message });
      }
    });

    app.get("/myTasks/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const myTasks = await taskCollection
          .find({ creator_email: email })
          .toArray();
        res.send(myTasks);
      } catch (err) {
        res.send({ error: err.message });
      }
    });

    app.get("/submission/:email", async (req, res) => {
      const email = req.params.email;
      const mySubmissions = await submissionCollection
        .find({ worker_email: email })
        .toArray();
      res.send(mySubmissions.reverse());
    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ user_email: email });
      res.send(user);
    });

    app.get("/users", async (req, res) => {
      try {
        const users = await usersCollection.find().toArray();
        res.send(users);
      } catch (err) {
        res.send({ error: err.message });
      }
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const user_email = user.user_email;
      const existingUser = await usersCollection.findOne({
        user_email: user_email,
      });
      if (existingUser) {
        return res.send({
          acknowledged: false,
          message: "user already exists",
        });
      }
      const result = await usersCollection.insertOne(user);
      console.log(result);
      res.send(result);
    });

    app.post("/submission", async (req, res) => {
      const submission = req.body;
      const result = await submissionCollection.insertOne(submission);
      res.send(result);
    });

    app.post("/withdraw", async (req, res) => {
      try {
        const withdraw = req.body;
        const result = await withdrawCollection.insertOne(withdraw);
        console.log(result);
        res.send(result);
      } catch (err) {
        console.log(err.message);
        res.send({ error: err.message });
      }
    });

    app.post("/task", async (req, res) => {
      try {
        const task = req.body;
        const { task_count, payable_amount, creator_email } = task;
        const result = await taskCollection.insertOne(task);
        const deductCoinAmount = task_count * payable_amount;
        await usersCollection.updateOne(
          { user_email: creator_email },
          { $inc: { coin: -deductCoinAmount } }
        );
        res.send(result);
      } catch (err) {
        res.send({ error: err.message });
      }
    });

    app.patch("/task/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { task_title, task_detail, submission_info } = req.body;
        const result = await taskCollection.updateOne(
          { _id: ObjectId.createFromHexString(id) },
          {
            $set: {
              task_title,
              task_detail,
              submission_info,
            },
          }
        );
        res.send(result);
      } catch (err) {
        res.send({ error: err.message });
      }
    });

    app.patch("/user", async (req, res) => {
      try {
        const { id, role: updatedRole } = req.body;

        const result = await usersCollection.updateOne(
          { _id: ObjectId.createFromHexString(id) },
          { $set: { role: updatedRole } }
        );
        console.log(result);
        res.send(result);
      } catch (err) {
        console.log(result);
        res.send({ error: err.message });
      }
    });

    app.delete("/task", async (req, res) => {
      try {
        const { id, coin, email } = req.body;
        await usersCollection.updateOne(
          { user_email: email },
          { $inc: { coin: coin } }
        );
        const result = await taskCollection.deleteOne({
          _id: ObjectId.createFromHexString(id),
        });
        res.send(result);
      } catch (err) {
        res.send({ error: err.message });
      }
    });

    app.get("/payments/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const payments = await paymentCollection
          .find({ email: email })
          .toArray();
        res.send(payments.reverse());
      } catch (err) {
        res.send({ error: err.message });
      }
    });

    app.post("/create-payment-intent", async (req, res) => {
      try {
        const { dollars } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: parseInt(dollars * 100),
          currency: "usd",
          payment_method_types: ["card"],
        });

        res.send({ client_secret: paymentIntent.client_secret });
      } catch (err) {
        res.send({ error: err.message });
      }
    });

    app.post("/payment", async (req, res) => {
      try {
        const payment = req.body;

        await usersCollection.updateOne(
          { user_email: payment.email },
          { $inc: { coin: payment.coin_purchase } }
        );

        const result = await paymentCollection.insertOne(payment);
        res.send(result);
      } catch (err) {
        console.log(err);
        res.send({ error: err.message });
      }
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("nano machine's son");
});

app.listen(port, () => {
  console.log(`nano bots are working on ${port}`);
});