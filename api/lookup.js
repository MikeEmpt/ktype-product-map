// /api/lookup.js

import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const vrm = req.query.reg;
  const API_KEY = '944ee147-f327-48d6-a86f-8d9391baefbd';
  const PACKAGE_NAME = 'VehicleDetails';
  const API_URL = 'https://uk.api.vehicledataglobal.com/r2/lookup';

  if (!vrm) {
    return res.status(400).json({ error: 'Missing VRM in query param ?reg=' });
  }

  try {
    const response = await axios.get(API_URL, {
      params: {
        packagename: PACKAGE_NAME,
        apikey: API_KEY,
        vrm: vrm
      }
    });

    const result = response.data;

    // Extract KTypes (adapt structure if needed based on live response)
    let ktypes = [];

    try {
      ktypes = result?.Results?.TechnicalDetails?.KType ?? [];
    } catch (err) {
      // Optional: log the error
    }

    return res.status(200).json({
      vrm,
      ktypes,
      raw_response: result
    });

  } catch (error) {
    return res.status(500).json({
      error: 'API error',
      details: error.response?.data || error.message
    });
  }
}
