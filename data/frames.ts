import { Frame } from '@/types/drone';

export const frames: Record<string, Frame> = {
  "iFlight Nazgul5 V2": {
    type: "Racing",
    weight: "85g",
    wheelbase: "220mm",
    propellerSizeCompatibility: "5-inch, 5.1-inch",
    material: "Carbon Fiber 3mm",
    armThickness: "4mm",
    topPlateThickness: "3mm",
    bottomPlateThickness: "2mm",
    cameraMount: "20x20mm, 19x19mm",
    stackMounting: "30.5x30.5mm"
  },
  "TBS Source One V5": {
    type: "Freestyle",
    weight: "95g",
    wheelbase: "220mm",
    propellerSizeCompatibility: "5-inch",
    material: "Carbon Fiber 4mm",
    armThickness: "5mm",
    topPlateThickness: "3mm",
    bottomPlateThickness: "3mm",
    cameraMount: "20x20mm",
    stackMounting: "30.5x30.5mm"
  },
  "Armattan Chameleon": {
    type: "Freestyle",
    weight: "110g",
    wheelbase: "220mm",
    propellerSizeCompatibility: "5-inch, 5.1-inch",
    material: "Carbon Fiber 4mm",
    armThickness: "6mm",
    topPlateThickness: "3mm",
    bottomPlateThickness: "3mm",
    cameraMount: "20x20mm, 19x19mm",
    stackMounting: "30.5x30.5mm"
  }
  // Add more frames as needed...
};
