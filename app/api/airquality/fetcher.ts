import axios from "axios";

export class AirQualityFetcher {
  location: any;
  pollInterval: number;
  apiBase: string;
  apiKey: string | undefined;
  smoothingFactor: number;
  prevProcessed: any;
  locationId: number | null;
  sensorsMap: Record<string, string> | null;

  constructor(location: any, pollInterval?: number, smoothingFactor = 0.2) {
    this.location = location;
    this.pollInterval = pollInterval || 300000;
    this.apiBase = "https://api.openaq.org/v3";
    this.apiKey = process.env.OPENAQ_API_KEY;
    this.smoothingFactor = smoothingFactor;
    this.prevProcessed = null;
    this.locationId = null;
    this.sensorsMap = null;
  }

  async getLocationIdAndSensorsMap() {
    let params: any = { limit: 1 };
    if (this.location.city && this.location.country) {
      params.city = this.location.city;
      params.country = this.location.country;
      params.radius = 25000;
    } else if (this.location.lat && this.location.lon) {
      params.coordinates = `${this.location.lat},${this.location.lon}`;
      params.radius = 25000;
    } else {
      throw new Error("Invalid location format");
    }
    const response = await axios.get(`${this.apiBase}/locations`, {
      params,
      headers: { "x-api-key": this.apiKey },
    });
    if (
      response.data &&
      response.data.results &&
      response.data.results.length > 0
    ) {
      const loc = response.data.results[0];
      const sensorsMap: Record<string, string> = {};
      if (Array.isArray(loc.sensors)) {
        for (const s of loc.sensors) {
          if (s.id && s.parameter && typeof s.parameter.name === "string") {
            sensorsMap[s.id] = s.parameter.name.toLowerCase();
          }
        }
      }
      this.locationId = loc.id;
      this.sensorsMap = sensorsMap;
      return loc.id;
    } else {
      throw new Error("No location found for specified parameters");
    }
  }

  async ensureLocationAndSensors() {
    if (!this.locationId || !this.sensorsMap) {
      await this.getLocationIdAndSensorsMap();
    }
  }

  clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  normalize(value: number, min: number, max: number) {
    return (this.clamp(value, min, max) - min) / (max - min);
  }

  logNormalize(value: number, min: number, max: number) {
    const safeMin = min <= 0 ? 0.0001 : min;
    const safeValue = Math.max(value, safeMin);
    const logMin = Math.log(safeMin);
    const logMax = Math.log(max);
    const logValue = Math.log(safeValue);
    return (logValue - logMin) / (logMax - logMin);
  }

  processData(raw: Record<string, any>) {
    const ranges: Record<string, { min: number; max: number }> = {
      pm25: { min: 0, max: 500 },
      pm10: { min: 0, max: 600 },
      no2: { min: 0, max: 200 },
      o3: { min: 0, max: 200 },
      so2: { min: 0, max: 100 },
      co: { min: 0, max: 50 },
      temperature: { min: -20, max: 50 },
      humidity: { min: 0, max: 100 },
      wind: { min: 0, max: 30 },
    };
    const paramMap: Record<string, string[]> = {
      pm25: ["pm25", "pm2.5"],
      pm10: ["pm10"],
      no2: ["no2"],
      o3: ["o3"],
      so2: ["so2"],
      co: ["co"],
      temperature: ["temperature", "temp"],
      humidity: ["humidity"],
      wind: ["wind", "wind_speed"],
    };
    const processed: Record<string, any> = {};
    for (const key in paramMap) {
      const aliases = paramMap[key];
      let value = null;
      for (const alias of aliases) {
        if (raw[alias] !== undefined) {
          value = raw[alias];
          break;
        }
      }
      if (value === null || value === undefined || isNaN(value)) {
        value = ranges[key].min;
      }
      let norm;
      if (["pm25", "pm10"].includes(key)) {
        norm = this.logNormalize(value, ranges[key].min, ranges[key].max);
      } else {
        norm = this.normalize(value, ranges[key].min, ranges[key].max);
      }
      if (
        this.prevProcessed &&
        typeof this.prevProcessed[key + "_norm"] === "number"
      ) {
        norm =
          this.smoothingFactor * norm +
          (1 - this.smoothingFactor) * this.prevProcessed[key + "_norm"];
      }
      processed[key + "_norm"] = norm;
      processed[key] = value;
    }
    if (processed.co < 5) {
      processed.co_waveform = "sine";
    } else if (processed.co < 15) {
      processed.co_waveform = "triangle";
    } else {
      processed.co_waveform = "sawtooth";
    }
    this.prevProcessed = processed;
    return processed;
  }

  async fetchData() {
    try {
      await this.ensureLocationAndSensors();
      const locationId = this.locationId;
      const response = await axios.get(
        `${this.apiBase}/locations/${locationId}/latest`,
        {
          headers: { "x-api-key": this.apiKey },
        }
      );
      if (
        response.data &&
        response.data.results &&
        response.data.results.length > 0
      ) {
        const latest: Record<string, any> = {};
        for (const m of response.data.results) {
          const param = this.sensorsMap && this.sensorsMap[m.sensorsId];
          if (param) {
            latest[param] = m.value;
          }
        }
        return this.processData(latest);
      } else {
        throw new Error("No latest data found for location");
      }
    } catch (error: any) {
      throw error;
    }
  }

  async fetchSensorLocations() {
    await this.ensureLocationAndSensors();
    const response = await axios.get(
      `${this.apiBase}/locations/${this.locationId}`,
      { headers: { "x-api-key": this.apiKey } }
    );
    if (
      response.data &&
      response.data.results &&
      response.data.results.length > 0
    ) {
      const loc = response.data.results[0];
      if (Array.isArray(loc.sensors)) {
        return loc.sensors.map((s: any) => ({
          id: s.id,
          parameter: s.parameter?.name?.toLowerCase() || "unknown",
          coordinates: s.coordinates || loc.coordinates || null,
        }));
      }
    }
    return [];
  }

  async fetchDataWithSensors() {
    const data = await this.fetchData();
    const sensors = await this.fetchSensorLocations();
    return { ...data, sensors };
  }
}
