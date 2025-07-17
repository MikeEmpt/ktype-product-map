export default async function handler(req, res) {
  const { reg, make, model } = req.query;
  const UKVD_API_KEY = process.env.UKVD_API_KEY;
  const MAP_URL = 'https://ktype-product-map.vercel.app/k_type_to_partnumber.json';

  if (!UKVD_API_KEY) return res.status(500).json({ error: 'Missing UKVD API key' });

  let ktype = null;

  if (reg) {
    const ukvdRes = await fetch(`https://uk1.ukvehicledata.co.uk/api/datapackage/vehicledata?v=2&api_nullitems=1&auth_apikey=${UKVD_API_KEY}&key_VRM=${reg}&user_tag=&dataset=VehicleRegistration&verbose=yes`);
    const ukvdJson = await ukvdRes.json();
    ktype = ukvdJson?.Response?.DataItems?.VehicleRegistration?.KType;
  } else if (make && model) {
    const ukvdRes = await fetch(`https://uk1.ukvehicledata.co.uk/api/datapackage/vehicledata?v=2&auth_apikey=${UKVD_API_KEY}&key_Make=${make}&key_Model=${model}&dataset=BasicVehicleDetails`);
    const ukvdJson = await ukvdRes.json();
    ktype = ukvdJson?.Response?.DataItems?.BasicVehicleDetails?.KType;
  }

  if (!ktype) {
    return res.redirect(302, 'https://townparts.co.uk/pages/lookup-not-found');
  }

  try {
    const mapRes = await fetch(MAP_URL);
    const mapJson = await mapRes.json();
    const matchedSKUs = mapJson[ktype];

    if (!matchedSKUs || matchedSKUs.length === 0) {
      return res.redirect(302, 'https://townparts.co.uk/pages/lookup-not-found');
    }

    const query = matchedSKUs.map(sku => `q=${encodeURIComponent(sku)}`).join('+OR+');
    const finalURL = `https://townparts.co.uk/collections/all?${query}`;
    return res.redirect(302, finalURL);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load K-Type mapping file' });
  }
}
