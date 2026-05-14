import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

let cachedClient: any = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient.db('biopore-mapping').collection('biopori');
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 1,
  });

  await client.connect();
  cachedClient = client;
  return client.db('biopore-mapping').collection('biopori');
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const collection = await connectToDatabase();

    if (req.method === 'GET') {
      const biopori = await collection.find({}).toArray();
      // Map _id to id so the frontend can use point.id consistently
      const mapped = biopori.map((doc: any) => ({
        ...doc,
        id: doc._id.toString(),
      }));
      return res.status(200).json(mapped);
    } else if (req.method === 'POST') {
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
      return res.status(201).json({ ...newPoint, _id: result.insertedId });
    } else if (req.method === 'DELETE') {
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

      return res.status(200).json({ message: "Point deleted" });
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}