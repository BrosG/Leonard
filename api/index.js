import express from 'express';
import generatePlanHandler from './generate-plan.js';
import getServicesHandler from './get-services.js';

// GURU'S NOTE: This is the dedicated router. It acts as a switchboard for all API calls.
const router = express.Router();

// Define the clear, unambiguous rules for the switchboard.
// A POST request to the '/generate-plan' sub-path goes to the generatePlanHandler.
router.post('/generate-plan', generatePlanHandler);

// A POST request to the '/get-services' sub-path goes to the getServicesHandler.
router.post('/get-services', getServicesHandler);

// Export the router so the main server.js can use it.
export default router;