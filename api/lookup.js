import axios from 'axios';

export default async function handler(req, res) {
  const { reg } = req.query;

  if (!reg) {
    return res.status(400).json({ error: 'Missing reg parameter' });
  }

  const API_KEY = '944ee147-f327-48d6-a86f-8d9391baefbd';
  const PACKAGE_NAME = 'VehicleDetails';
  const API_URL = 'https://uk.api.vehicledataglobal.com/r2/lookup';

  try {
    // Step 1: Get vehicle data from UKVehicleData API
    const { data: result } = await axios.get(API_URL, {
      params: {
        packagename: PACKAGE_NAME,
        apikey: API_KEY,
        vrm: reg
      }
    });

    // Step 2: Extract KType(s)
    let ktypes = [];
    const rawKType = result?.Results?.TechnicalDetails?.KType;
    if (rawKType) {
      ktypes = Array.isArray(rawKType) ? rawKType : [rawKType];
    }

    if (ktypes.length === 0) {
      return res.status(404).json({ error: 'K-Type not found for reg', raw_response: result });
    }

    // Step 3: Load JSON map of KType to SKUs
    const mapRes = await axios.get('https://ktype-product-map.vercel.app/k_type_to_partnumber.json');
    const kTypeMap = mapRes.data;

    let matchedSKUs = [];
    for (const k of ktypes) {
      if (kTypeMap[k]) {
        matchedSKUs.push(...kTypeMap[k]);
      }
    }

    if (matchedSKUs.length === 0) {
      return res.status(404).json({ error: 'No SKUs found for these K-Types', ktypes });
    }

    return res.status(200).json({
      vrm: reg,
      ktypes,
      skus: matchedSKUs
    });

  } catch (err) {
    console.error('Lookup error:', err.message);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
