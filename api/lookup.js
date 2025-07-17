import fetch from 'node-fetch';

const KTYPE_JSON_URL = 'https://ktype-product-map.vercel.app/k_type_to_partnumber.json';
const COLLECTION_URL = 'https://townparts.co.uk/collections/all';

export default async function handler(req, res) {
  const { reg, make, model } = req.query;

  try {
    let ktype = null;

    // 🔍 1. Lookup KType via UKVehicleData if reg is supplied
    if (reg) {
      const apiKey = '944ee147-f327-48d6-a86f-8d9391baefbd';
      const response = await fetch(`https://api.ukvehicledata.co.uk/vehicledata/v1/vehicle?key=${apiKey}&licencePlate=${reg}&include=technicaldata`);
      const data = await response.json();

      if (data?.data?.technicaldata?.datapoints?.ktype) {
        ktype = data.data.technicaldata.datapoints.ktype.value;
      } else {
        return res.redirect(`/pages/manual-vehicle-selector`);
      }
    }

    // 🧰 2. If no reg or failed, use fallback (not implemented yet)
    if (!ktype && make && model) {
      // Optionally add fallback logic later
      return res.redirect(`/pages/manual-vehicle-selector`);
    }

    // 📦 3. Load JSON mapping
    const jsonResponse = await fetch(KTYPE_JSON_URL);
    const ktypeMap = await jsonResponse.json();

    const skus = ktypeMap[ktype];
    if (!skus || skus.length === 0) {
      return res.redirect(`/pages/not-found`);
    }

    // 🔗 4. Build redirect link
    const skuQuery = skus.map((sku) => encodeURIComponent(sku)).join('+');
    const finalUrl = `${COLLECTION_URL}?q=${skuQuery}`;
    return res.redirect(finalUrl);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
