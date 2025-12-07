import express, { Request, Response } from 'express';
import { verifyProof } from './verifier';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: Math.floor(Date.now() / 1000),
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.send('SolidKYC Backend - ZK Proof Verification Service');
});

// Verification endpoint
app.post('/verify', async (req: Request, res: Response) => {
  try {
    const { proof, public: publicInputs } = req.body;

    // Validate input
    if (!proof || !publicInputs) {
      return res.status(400).json({
        verified: false,
        error: 'Missing proof or public inputs',
      });
    }

    // Verify the proof
    const result = await verifyProof(proof, publicInputs);

    res.json({
      verified: result.verified,
      error: result.error || null,
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Health check available at http://0.0.0.0:${PORT}/health`);
  console.log(`Verify endpoint available at http://0.0.0.0:${PORT}/verify`);
});
