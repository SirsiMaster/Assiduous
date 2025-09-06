import { firebaseService } from '@/services/FirebaseService';
import { verifyAuth } from '@/utils/auth';

const handler = async (req, res) => {
  try {
    // Verify authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { collection, id } = req.query;
    const method = req.method;

    switch (method) {
      case 'GET': {
        const doc = await firebaseService.findById(collection, id);
        if (!doc) {
          return res.status(404).json({ error: 'Document not found' });
        }
        return res.status(200).json(doc);
      }

      case 'PUT':
      case 'PATCH': {
        const doc = await firebaseService.update(collection, id, req.body);
        return res.status(200).json(doc);
      }

      case 'DELETE': {
        await firebaseService.delete(collection, id);
        return res.status(204).end();
      }

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default handler;
