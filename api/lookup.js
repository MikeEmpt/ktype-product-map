import axios from 'axios';

export default async function handler(req, res) {
  const { reg } = req.query;

  if (!reg) {
    return res.status(400).json({ error: 'Missing reg parameter' });
  }

  try {
    // Step 1: Get K-Type from UKVehicleData
    const apiKey = '944ee147-f327-48d6-a86f-8d9391baefbd';
    const response = await axios.get('https://uk.api.vehicledataglobal.com/r2/lookup', {
      params: {
        packagename: 'VehicleDetails',
        apikey: apiKey,
        vrm: reg,
      },
    });

    const result = response.data;

    // 🔍 Debug log the full response
    console.log('Full API response:', JSON.stringify(result, null, 2));

    const ktypes = result?.Results?.TechnicalDetails?.KType;
    if (!ktypes) {
      return res.status(404).json({ error: 'K-Type not found for reg', fullResponse: result });
    }

    return res.status(200).json({ vrm: reg, ktypes });
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Server error',
      details: error.response?.data || error.message,
    });
  }
}
