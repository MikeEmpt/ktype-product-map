import axios from 'axios';

export default async function handler(req, res) {
  const { reg } = req.query;

  if (!reg) {
    return res.status(400).json({ error: 'Missing reg parameter' });
  }

  try {
    const response = await axios.get('https://uk.api.vehicledataglobal.com/r2/lookup', {
      params: {
        packagename: 'VehicleDetails',
        apikey: '944ee147-f327-48d6-a86f-8d9391baefbd',
        vrm: reg
      }
    });

    const result = response.data;

    const ktypes = result?.Results?.TechnicalDetails?.KType || [];

    if (!ktypes || ktypes.length === 0) {
      return res.status(404).json({
        error: 'K-Type not found for reg',
        raw_response: result
      });
    }

    const mapRes = await axios.get('https://ktype-product-map.vercel.app/k_type_to_partnumber.json');
    const kTypeMap = mapRes.data;

    const skuList = kTypeMap[ktypes] || [];

    return res.status(200).json({
      vrm: reg,
      ktypes,
      skus: skuList,
      raw_response: result
    });

  } catch (error) {
    console.error('API failed:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      detail: error.response?.data || 'No additional error data'
    });
  }
}
