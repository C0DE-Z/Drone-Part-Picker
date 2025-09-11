import { Camera } from '@/types/drone';

export const cameras: Record<string, Camera> = {
  "RunCam Phoenix 2": {
    sensorSize: "1/3\"",
    resolution: "1080p@60fps",
    aspectRatio: "16:9",
    lens: "2.1mm FOV 155°",
    weight: "6.5g",
    voltageInput: "5V",
    minIllumination: "0.01 Lux",
    type: "Analog",
    features: "WDR, Low Light"
  },
  "Caddx Ratel 2": {
    sensorSize: "1/2.8\"",
    resolution: "1200TVL",
    aspectRatio: "4:3, 16:9",
    lens: "2.1mm FOV 160°",
    weight: "8.2g",
    voltageInput: "5V-40V",
    minIllumination: "0.0001 Lux",
    type: "Analog",
    features: "Starlight, WDR"
  },
  "DJI O3 Air Unit": {
    sensorSize: "1/1.3\"",
    resolution: "4K@60fps",
    aspectRatio: "16:9",
    lens: "Variable FOV",
    weight: "35g",
    voltageInput: "7.4V-17.6V",
    type: "Digital",
    features: "4K Recording, 10km Range, OSD"
  },
  "Walksnail Avatar HD": {
    sensorSize: "1/2\"",
    resolution: "1080p@60fps",
    aspectRatio: "16:9",
    lens: "2.1mm FOV 150°",
    weight: "27g",
    voltageInput: "7V-25.2V",
    type: "Digital",
    features: "HD Recording, Low Latency"
  },
  "RunCam Micro Swift 3": {
    sensorSize: "1/3\"",
    resolution: "600TVL",
    aspectRatio: "4:3",
    lens: "2.3mm FOV 130°",
    weight: "4.5g",
    voltageInput: "5V-36V",
    minIllumination: "0.01 Lux",
    type: "Analog",
    features: "Ultra Light, Wide Voltage"
  }
};
