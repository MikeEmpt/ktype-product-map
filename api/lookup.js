import axios from 'axios';

export default async function handler(req, res) {
  const { reg } = req.query;

  if (!reg) {
    return res.status(400).json({ error: 'Missing reg parameter' });
  }

  try {
    const apiKey = '944ee147-f327-48d6-a86f-8d9391baefbd';

    // First API call – VehicleDetails (for K-Type)
    const detailsRes = await axios.get('https://uk.api.vehicledataglobal.com/r2/lookup', {
      params: {
        packagename: 'VehicleDetails',
        apikey: apiKey,
        vrm: reg
      }
    });

    const details = detailsRes.data;
    const kType = details?.Results?.VehicleCodes?.TecDocKTypeCode;

    // Second API call – VehicleImageV2 (for Image URL)
    const imageRes = await axios.get('https://uk.api.vehicledataglobal.com/r2/lookup', {
      params: {
        packagename: 'VehicleImageV2',
        apikey: apiKey,
        vrm: reg
      }
    });

    const imageList = imageRes?.data?.Results?.VehicleImageDetails?.VehicleImageList;
    const imageUrl = imageList && imageList.length > 0 ? imageList[0].ImageUrl : null;

    // Load K-Type to SKU map
    const mapRes = await axios.get('https://ktype-product-map.vercel.app/k_type_to_partnumber.json');
    const kTypeMap = mapRes.data;
    const skuList = kTypeMap[kType];

    if (!kType || !skuList || skuList.length === 0) {
      return res.status(404).json({
        error: 'Data not found for this reg',
        kType,
        imageUrl,
        fullDetails: details
      });
    }

    return res.status(200).json({
      reg,
      k_type: kType,
      skus: skuList,
      image_url: imageUrl
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
