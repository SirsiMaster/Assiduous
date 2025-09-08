import { firebaseService } from '@/services/firebaseservice';
import { verifyAuth } from '@/utils/auth';

const handler = async (req, res) => {
  try {
    // Verify authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { collection } = req.query;
    const method = req.method;

    switch (method) {
      case 'GET': {
        // Parse query parameters
        const { where, orderBy, limit, startAfter } = req.query;
        const queryParams = {
          where: where ? JSON.parse(where) : undefined,
          orderBy: orderBy ? JSON.parse(orderBy) : undefined,
          limit: limit ? parseInt(limit, 10) : undefined,
          startAfter: startAfter || undefined
        };

        const docs = await firebaseService.find(collection, queryParams);
        return res.status(200).json(docs);
      }

      case 'POST': {
        const doc = await firebaseService.create(collection, req.body);
        return res.status(201).json(doc);
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default handler;
