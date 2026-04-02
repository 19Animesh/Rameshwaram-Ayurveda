import { NextResponse } from 'next/server';

// Fallback data for common Indian pincodes in case external API is down
const PINCODE_FALLBACK = {
  '243001': { city: 'Bareilly', state: 'Uttar Pradesh' },
  '243002': { city: 'Bareilly', state: 'Uttar Pradesh' },
  '243003': { city: 'Bareilly', state: 'Uttar Pradesh' },
  '243004': { city: 'Bareilly', state: 'Uttar Pradesh' },
  '243005': { city: 'Bareilly', state: 'Uttar Pradesh' },
  '110001': { city: 'New Delhi', state: 'Delhi' },
  '400001': { city: 'Mumbai', state: 'Maharashtra' },
  '560001': { city: 'Bengaluru', state: 'Karnataka' },
  '700001': { city: 'Kolkata', state: 'West Bengal' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu' },
  '500001': { city: 'Hyderabad', state: 'Telangana' },
  '411001': { city: 'Pune', state: 'Maharashtra' },
  '380001': { city: 'Ahmedabad', state: 'Gujarat' },
  '302001': { city: 'Jaipur', state: 'Rajasthan' },
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode');

    if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
      return NextResponse.json({ error: 'Valid 6-digit Pincode is required' }, { status: 400 });
    }

    // 1. Try the fallback map first (instant, no network)
    if (PINCODE_FALLBACK[pincode]) {
      return NextResponse.json({
        pincode,
        city: PINCODE_FALLBACK[pincode].city,
        state: PINCODE_FALLBACK[pincode].state,
        country: 'India',
      });
    }

    // 2. Try external Postal Pincode API with a 5-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      const data = await response.json();

      if (!data || !data[0] || data[0].Status === 'Error' || !data[0].PostOffice?.length) {
        return NextResponse.json({ error: 'Pincode not found. Please enter city and state manually.' }, { status: 404 });
      }

      const postOffice = data[0].PostOffice[0];
      return NextResponse.json({
        pincode,
        city: postOffice.District,
        state: postOffice.State,
        country: postOffice.Country,
      });

    } catch (fetchErr) {
      clearTimeout(timeout);
      // External API is down or timed out — return graceful error
      return NextResponse.json(
        { error: 'Pincode service is temporarily unavailable. Please enter your city and state manually.' },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('Pincode Validation Error:', error);
    return NextResponse.json({ error: 'Failed to validate pincode' }, { status: 500 });
  }
}
