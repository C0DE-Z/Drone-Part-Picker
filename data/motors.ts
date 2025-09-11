import { Motor } from '@/types/drone';

export const motors: Record<string, Motor> = {
  "T-Motor F40 Pro IV 2207": {
    statorSize: "2207",
    kv: 1950,
    voltageCompatibility: "4-6S LiPo",
    weight: "31.5g (with short wires)",
    maxThrust: "Approx. 1.8kg (on 6S with 5-inch prop)",
    propCompatibility: "5-inch, 5.1-inch",
    shaftDiameter: "5mm",
    bearings: "NSK",
    magnetType: "N52H Arc Magnets",
    wireGauge: "20AWG"
  },
  "T-Motor F40 Pro III 2207": {
    statorSize: "2207",
    kv: 2400,
    voltageCompatibility: "4-6S LiPo",
    weight: "30.5g (with short wires)",
    maxThrust: "Approx. 1.9kg (on 6S with 5-inch prop)",
    propCompatibility: "5-inch, 5.1-inch",
    shaftDiameter: "5mm",
    bearings: "NSK",
    magnetType: "N52H Arc Magnets",
    wireGauge: "20AWG"
  },
  "T-Motor F40 Pro II 2207": {
    statorSize: "2207",
    kv: 2700,
    voltageCompatibility: "4-6S LiPo",
    weight: "29.8g (with short wires)",
    maxThrust: "Approx. 2.0kg (on 6S with 5-inch prop)",
    propCompatibility: "5-inch, 5.1-inch",
    shaftDiameter: "5mm",
    bearings: "NSK",
    magnetType: "N52H Arc Magnets",
    wireGauge: "20AWG"
  },
  "T-Motor F60 Pro V 2207": {
    statorSize: "2207",
    kv: 1750,
    voltageCompatibility: "4-6S LiPo",
    weight: "33.2g (with short wires)",
    maxThrust: "Approx. 1.7kg (on 5S with 5-inch prop)",
    propCompatibility: "5-inch, 5.1-inch, 6-inch",
    shaftDiameter: "5mm",
    bearings: "NSK",
    magnetType: "N52H Arc Magnets",
    wireGauge: "20AWG"
  },
  "T-Motor Velox V2 2207": {
    statorSize: "2207",
    kv: 2200,
    voltageCompatibility: "4-6S LiPo",
    weight: "32.1g (with short wires)",
    maxThrust: "Approx. 1.85kg (on 6S with 5-inch prop)",
    propCompatibility: "5-inch, 5.1-inch",
    shaftDiameter: "5mm",
    bearings: "NSK",
    magnetType: "N52H Arc Magnets",
    wireGauge: "20AWG"
  }
  // Add more motors as needed...
};
