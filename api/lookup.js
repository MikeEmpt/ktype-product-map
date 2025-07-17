import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { reg } = req.query;

  if (!reg) {
    return res.status(400).json({ error: 'Missing reg parameter' });
  }

  try {
    // Step 1: Get K-Type from UKVehicleData
    const apiKey = '944ee147-f327-48d6-a86f-8d9391baefbd'; // 🔐 your API key
    const response = await fetch(`https://uk1.ukvehicledata.co.uk/api/datapackage/VehicleData?v=2&api_nullitems=1&auth_apikey=${apiKey}&user_tag=&key_VRM=${reg}`);
    const data = await response.json();

    const kType = data?.Response?.DataItems?.VehicleRegistration?.KType;
    if (!kType) {
      return res.status(404).json({ error: 'K-Type not found for reg' });
    }

    // Step 2: Load JSON of k_type_to_partnumber
    const mapRes = await fetch('https://ktype-product-map.vercel.app/k_type_to_partnumber.json');
    const kTypeMap = await mapRes.json();

    const skuList = kTypeMap[kType];

    if (!skuList || skuList.length === 0) {
      return res.status(404).json({ error: 'No SKUs found for this K-Type' });
    }

    // Step 3: Return list of SKUs
    return res.status(200).json({
      k_type: kType,
      skus: skuList
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
