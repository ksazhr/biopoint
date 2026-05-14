import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = 'biopore-mapping';
const collectionName = 'biopori';

let client;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName).collection(collectionName);
}

export default async function handler(req, res) {
  try {
    const collection = await connectToDatabase();

    if (req.method === 'GET') {
      const biopori = await collection.find({}).toArray();
      res.status(200).json(biopori);
    } else if (req.method === 'POST') {
      // Basic auth check
      const authHeader = req.headers.authorization;
      if (authHeader !== "Bearer admin-secret-123") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { name, description, lat, lng } = req.body;
      if (!name || lat === undefined || lng === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const newPoint = {
        name,
        description,
        lat,
        lng,
        createdAt: new Date()
      };

      const result = await collection.insertOne(newPoint);
      res.status(201).json({ ...newPoint, _id: result.insertedId });
    } else if (req.method === 'DELETE') {
      // Basic auth check
      const authHeader = req.headers.authorization;
      if (authHeader !== "Bearer admin-secret-123") {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Missing ID" });
      }

      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Point not found" });
      }

      res.status(200).json({ message: "Point deleted" });
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}