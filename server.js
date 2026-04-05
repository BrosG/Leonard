import express from 'express';
import cors from 'cors';
// GURU'S NOTE: We import a single, master "api" router now.
import apiRouter from './api/index.js';

const app = express();
const PORT = 3000;

// Set up the essential middleware
app.use(cors());
app.use(express.json());

// GURU'S NOTE: This is the crucial change. We tell Express:
// "For any request that starts with '/api', hand it over to our dedicated apiRouter to handle."
// This creates a clean and unambiguous routing structure.
app.use('/api', apiRouter);

// Start listening for requests
app.listen(PORT, () => {
  console.log(`[dev:api] > Express API server ready at http://localhost:${PORT}`);
});