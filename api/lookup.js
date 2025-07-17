const axios = require('axios');

module.exports = async (req, res) => {
  const { reg } = req.query;

  if (!reg) {
    return res.status(400).json({ error: 'Missing registration number' });
  }

  try {
    // Fetch K-Type from UKVehicleData
    const ukvdResponse = await axios.get('https://v2.api.ukvehicledata.co.uk/r2/lookup', {
      params: {
        api_nullitems: '1',
        user_tag: 'ktype-check',
        key_vrm: reg,
        api_key: process.env.UKVD_API_KEY
      }
    });

    const ktype = ukvdResponse?.data?.Response?.DataItems?.VehicleRegistration?.KType;

    if (!ktype) {
      return res.status(404).json({ error: 'K-Type not found for reg' });
    }

    // Fetch mapping file
    const skuResponse = await axios.get('https://ktype-product-map.vercel.app/k_type_to_partnumber.json');

    const skuList = skuResponse.data[String(ktype)] || [];

    return res.status(200).json({ ktype, skus: skuList });
  } catch (err) {
    console.error('Lookup error:', err.message || err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
};
