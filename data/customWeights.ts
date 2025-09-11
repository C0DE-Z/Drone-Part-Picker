import { CustomWeight } from '@/types/drone';

export const customWeights: Record<string, CustomWeight> = {
  "VTX 25mW": {
    weight: "5g",
    description: "Video transmitter 25mW output power"
  },
  "VTX 200mW": {
    weight: "8g",
    description: "Video transmitter 200mW output power"
  },
  "VTX 800mW": {
    weight: "12g",
    description: "Video transmitter 800mW output power"
  },
  "GPS Module": {
    weight: "15g",
    description: "GPS module for position hold and return to home"
  },
  "Receiver 2.4GHz": {
    weight: "3g",
    description: "2.4GHz receiver for drone control"
  },
  "Receiver ExpressLRS": {
    weight: "1.5g",
    description: "ExpressLRS long range receiver"
  },
  "Receiver Crossfire": {
    weight: "4g",
    description: "TBS Crossfire long range receiver"
  },
  "Action Camera (GoPro)": {
    weight: "120g",
    description: "GoPro action camera for recording"
  },
  "Action Camera (DJI)": {
    weight: "135g",
    description: "DJI Action camera for recording"
  },
  "Naked GoPro": {
    weight: "25g",
    description: "Stripped down GoPro for racing"
  },
  "Propeller Guards": {
    weight: "20g",
    description: "Protective guards for propellers"
  },
  "LED Strip": {
    weight: "8g",
    description: "RGB LED strip for visibility"
  },
  "Buzzer": {
    weight: "2g",
    description: "Lost drone buzzer"
  },
  "XT60 Connector": {
    weight: "5g",
    description: "XT60 power connector"
  },
  "XT30 Connector": {
    weight: "3g",
    description: "XT30 power connector"
  },
  "Landing Gear": {
    weight: "15g",
    description: "Retractable or fixed landing gear"
  },
  "Antenna": {
    weight: "2g",
    description: "Additional antenna weight"
  },
  "Capacitor 1000uF": {
    weight: "4g",
    description: "Power filtering capacitor"
  },
  "ESC Capacitor 470uF": {
    weight: "2g",
    description: "ESC low ESR capacitor"
  },
  "Wiring/Cables": {
    weight: "10g",
    description: "Additional wiring and cables"
  }
};
