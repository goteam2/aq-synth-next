"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wind, Activity } from "lucide-react";
import { AirQualityData } from "@/types/air-quality";

interface ParameterDisplayProps {
  airQualityData: AirQualityData | null;
  loading: boolean;
  error: string | null;
}

const getAQIColor = (value: number, pollutant: string): string => {
  if (pollutant === "pm25") {
    if (value <= 12) return "bg-green-500";
    if (value <= 35.4) return "bg-yellow-500";
    if (value <= 55.4) return "bg-orange-500";
    return "bg-red-500";
  }
  return "bg-blue-500";
};

const ParameterDisplay: React.FC<ParameterDisplayProps> = ({
  airQualityData,
  loading,
  error,
}) => {
  return (
    <div className="space-y-6 flex flex-col">
      {/* Location Info */}
      <Card className="bg-gray-800/80 backdrop-blur border-gray-700">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center gap-2">
            <Wind className="w-5 h-5 text-green-400" />
            Location Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-gray-400">Loading air quality data...</div>
          )}
          {error && <div className="text-red-400">{error}</div>}
          {airQualityData && (
            <div className="space-y-2">
              <div className="text-white font-medium">
                {airQualityData.location}
              </div>
              {airQualityData.lat !== undefined &&
                airQualityData.lon !== undefined && (
                  <div className="text-gray-400 text-xs">
                    Lat: {airQualityData.lat.toFixed(5)}, Lon:{" "}
                    {airQualityData.lon.toFixed(5)}
                  </div>
                )}
              <div className="text-gray-400 text-sm">
                Updated {airQualityData.lastUpdated}
              </div>
              <Badge
                variant="outline"
                className="text-green-400 border-green-400"
              >
                <Wind className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Air Quality Readings */}
      <Card className="bg-gray-800/80 backdrop-blur border-gray-700">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Air Quality Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="text-gray-400">Loading air quality data...</div>
          )}
          {error && <div className="text-red-400">{error}</div>}
          {airQualityData && (
            <>
              {/* PM2.5 */}
              <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <div>
                  <div className="text-white font-medium">PM2.5</div>
                  <div className="text-xs text-gray-400">Fine Particles</div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="text-white font-bold">
                    {airQualityData.pm25}
                  </div>
                  <div className="text-xs text-gray-400">μg/m³</div>
                  <div
                    className={`w-2 h-2 rounded-full ${getAQIColor(
                      airQualityData.pm25,
                      "pm25"
                    )} mt-1`}
                  ></div>
                </div>
              </div>
              {/* PM10 */}
              <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <div>
                  <div className="text-white font-medium">PM10</div>
                  <div className="text-xs text-gray-400">Coarse Particles</div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="text-white font-bold">
                    {airQualityData.pm10}
                  </div>
                  <div className="text-xs text-gray-400">μg/m³</div>
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1"></div>
                </div>
              </div>
              {/* NO2 */}
              <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <div>
                  <div className="text-white font-medium">NO₂</div>
                  <div className="text-xs text-gray-400">Nitrogen Dioxide</div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="text-white font-bold">
                    {airQualityData.no2}
                  </div>
                  <div className="text-xs text-gray-400">ppb</div>
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1"></div>
                </div>
              </div>
              {/* O3 */}
              <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <div>
                  <div className="text-white font-medium">O₃</div>
                  <div className="text-xs text-gray-400">Ozone</div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="text-white font-bold">
                    {airQualityData.o3}
                  </div>
                  <div className="text-xs text-gray-400">ppb</div>
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1"></div>
                </div>
              </div>
              {/* SO2 */}
              <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <div>
                  <div className="text-white font-medium">SO₂</div>
                  <div className="text-xs text-gray-400">Sulfur Dioxide</div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="text-white font-bold">
                    {airQualityData.so2}
                  </div>
                  <div className="text-xs text-gray-400">ppb</div>
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1"></div>
                </div>
              </div>
              {/* CO */}
              <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <div>
                  <div className="text-white font-medium">CO</div>
                  <div className="text-xs text-gray-400">Carbon Monoxide</div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="text-white font-bold">
                    {airQualityData.co}
                  </div>
                  <div className="text-xs text-gray-400">ppm</div>
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1"></div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParameterDisplay;
