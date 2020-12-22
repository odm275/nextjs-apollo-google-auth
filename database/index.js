import { MongoClient } from "mongodb";
console.log(process.env.DB_USER);
console.log(process.env.DB_USER_PASSWORD);
console.log(process.env.DB_CLUSTER);

const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_USER_PASSWORD}@${process.env.DB_CLUSTER}.mongodb.net/<dbname>?retryWrites=true&w=majority`;

export const connectDatabase = async () => {
  const client = await MongoClient.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = client.db("main");
  return {
    users: db.collection("users"),
    tasks: db.collection("tasks"),
  };
};
