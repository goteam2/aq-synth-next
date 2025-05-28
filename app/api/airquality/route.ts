import { NextRequest, NextResponse } from "next/server";
import { AirQualityFetcher } from "./fetcher";

const defaultLocation =
  process.env.LOCATION_CITY && process.env.LOCATION_COUNTRY
    ? { city: process.env.LOCATION_CITY, country: process.env.LOCATION_COUNTRY }
    : { lat: process.env.LOCATION_LAT, lon: process.env.LOCATION_LON };
const pollInterval = process.env.POLL_INTERVAL
  ? parseInt(process.env.POLL_INTERVAL)
  : 300000;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let location: any = { ...defaultLocation };
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    const city = searchParams.get("city");
    const country = searchParams.get("country");
    if (lat && lon) {
      location = { lat: parseFloat(lat), lon: parseFloat(lon) };
    } else if (city && country) {
      location = { city, country };
    }
    const fetcher = new AirQualityFetcher(location, pollInterval);
    const data = await fetcher.fetchDataWithSensors();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
