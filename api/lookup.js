import axios from 'axios';

export default async function handler(req, res) {
  const { reg } = req.query;

  if (!reg) {
    return res.status(400).json({ error: 'Missing reg parameter' });
  }

  try {
    const apiKey = '944ee147-f327-48d6-a86f-8d9391baefbd';

    const response = await axios.get('https://uk.api.vehicledataglobal.com/r2/lookup', {
      params: {
        packagename: 'VehicleDetails',
        apikey: apiKey,
        vrm: reg
      }
    });

    const data = response.data;

    // ✅ Correct K-Type path based on real API response
    const kType = data?.Results?.VehicleCodes?.TecDocKTypeCode;

    if (!kType) {
      return res.status(404).json({ error: 'K-Type not found for reg', fullResponse: data });
    }

    // Load the mapping file of K-Type → SKUs
    const mapRes = await axios.get('https://ktype-product-map.vercel.app/k_type_to_partnumber.json');
    const kTypeMap = mapRes.data;

    const skuList = kTypeMap[kType];

    if (!skuList || skuList.length === 0) {
      return res.status(404).json({ error: 'No SKUs found for this K-Type', kType });
    }

    return res.status(200).json({ reg, k_type: kType, skus: skuList });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
