export interface Motor {
  statorSize: string;
  kv: number;
  voltageCompatibility: string;
  weight: string;
  maxThrust: string;
  propCompatibility: string;
  shaftDiameter: string;
  bearings: string;
  magnetType: string;
  wireGauge: string;
  price?: number;
  priceRange?: string;
}

export interface Frame {
  type: string;
  weight: string;
  wheelbase: string;
  propellerSizeCompatibility: string;
  material: string;
  armThickness: string;
  topPlateThickness: string;
  bottomPlateThickness: string;
  cameraMount: string;
  stackMounting: string;
  price?: number;
  priceRange?: string;
}

export interface Stack {
  type: string;
  fcProcessor: string;
  escCurrentRating: string;
  mountingSize: string;
  gyro: string;
  osd: string;
  bluetooth: string;
  voltageInput: string;
  price?: number;
  priceRange?: string;
}

export interface Camera {
  sensorSize?: string;
  resolution: string;
  aspectRatio: string;
  lens: string;
  weight: string;
  voltageInput: string;
  minIllumination?: string;
  type?: string;
  features?: string;
  price?: number;
  priceRange?: string;
}

export interface Prop {
  size: string;
  pitch: string;
  blades: number;
  material: string;
  weight: string;
  hubID: string;
  recommendedMotorSize: string;
  price?: number;
  priceRange?: string;
}

export interface Battery {
  capacity: string;
  voltage: string;
  cRating: string;
  weight: string;
  connector: string;
  dimensions: string;
  price?: number;
  priceRange?: string;
}

export interface CustomWeight {
  weight: string;
  description?: string;
  price?: number;
  priceRange?: string;
}

export interface DroneComponents {
  Motors: Record<string, Motor>;
  Frames: Record<string, Frame>;
  Stacks: Record<string, Stack>;
  Camera: Record<string, Camera>;
  Props: Record<string, Prop>;
  Batteries: Record<string, Battery>;
  'Simple Weight': Record<string, CustomWeight>;
}

export interface SelectedComponents {
  motor?: { name: string; data: Motor };
  frame?: { name: string; data: Frame };
  stack?: { name: string; data: Stack };
  camera?: { name: string; data: Camera };
  prop?: { name: string; data: Prop };
  battery?: { name: string; data: Battery };
  customWeights?: { name: string; data: CustomWeight }[];
}


export interface PerformanceEstimate {
  totalWeight: number;
  thrustToWeightRatio: number;
  maxThrust: number; // in kg
  maxThrustGrams: number; // in grams for calculations
  estimatedTopSpeed: number;
  estimatedFlightTime: number;
  powerConsumption: number;
  hovering: {
    throttlePercentage: number;
    currentDraw: number;
    hoverTime: number;
  };
  motors: {
    kv: number;
    voltage: number;
    estimatedRPM: number;
    propSize: string;
  };
  battery: {
    voltage: number;
    capacity: number;
    cells: number;
    dischargeRate: number;
  };
  totalPrice: number;
  priceBreakdown: {
    motor?: number;
    frame?: number;
    stack?: number;
    camera?: number;
    prop?: number;
    battery?: number;
    customWeights?: number;
  };
  compatibility: {
    propMotorMatch: boolean;
    voltageMatch: boolean;
    mountingMatch: boolean;
    frameStackMatch: boolean;
  };
}


export interface SavedDrone {
  id: string;
  name: string;
  components: SelectedComponents;
  performanceEstimate: PerformanceEstimate;
  createdAt: string;
  updatedAt: string;
  userId: string;
  isPublic: boolean;
  description?: string;
  imageUrl?: string;
  tags?: string[];
  compatibilityIssues?: {
    propMotorMatch: boolean;
    voltageMatch: boolean;
    mountingMatch: boolean;
    frameStackMatch: boolean;
  };
}