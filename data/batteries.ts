import { Battery } from '@/types/drone';

export const batteries: Record<string, Battery> = {
  "Tattu R-Line 4S 1550mAh 95C": {
    capacity: "1550mAh",
    voltage: "14.8V",
    cRating: "95C",
    weight: "186g",
    dimensions: "75x35x33mm",
    connector: "XT60"
  },
  "CNHL 4S 1300mAh 100C": {
    capacity: "1300mAh", 
    voltage: "14.8V",
    cRating: "100C",
    weight: "160g",
    dimensions: "70x32x30mm",
    connector: "XT60"
  },
  "GNB 4S 1800mAh 120C": {
    capacity: "1800mAh",
    voltage: "14.8V", 
    cRating: "120C",
    weight: "215g",
    dimensions: "80x35x35mm",
    connector: "XT60"
  },
  "Tattu 6S 1400mAh 75C": {
    capacity: "1400mAh",
    voltage: "22.2V",
    cRating: "75C", 
    weight: "280g",
    dimensions: "75x40x35mm",
    connector: "XT60"
  },
  "ISDT 4S 650mAh 80C": {
    capacity: "650mAh",
    voltage: "14.8V",
    cRating: "80C",
    weight: "82g",
    dimensions: "60x28x25mm", 
    connector: "XT30"
  },
  "Emax 3S 1100mAh 45C": {
    capacity: "1100mAh",
    voltage: "11.1V",
    cRating: "45C",
    weight: "110g",
    dimensions: "70x30x28mm",
    connector: "XT60"
  },
  "BetaFPV 2S 450mAh 75C": {
    capacity: "450mAh",
    voltage: "7.4V",
    cRating: "75C",
    weight: "28g",
    dimensions: "50x20x15mm",
    connector: "PH2.0"
  }
};
