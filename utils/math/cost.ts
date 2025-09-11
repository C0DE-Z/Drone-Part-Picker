import { DroneCalculator } from '../droneCalculator';

type ComponentData = {
  price?: number;
  [key: string]: string | number | undefined;
};

export function estimateComponentPrice(type: string, data: ComponentData): number {
    
    switch (type) {
      case 'motor':
        const kv = data.kv || 2000;
        const statorSizeStr = typeof data.statorSize === 'string' ? data.statorSize : String(data.statorSize || '20');
        const statorSize = parseFloat(statorSizeStr.replace(/[^\d.]/g, '') || '20');
  return Math.round(((statorSize * 2 + Number(kv) * 0.01) * 0.8) / 1000) * 4;

      case 'frame':
        const materialStr = typeof data.material === 'string' ? data.material : String(data.material || '');
        const material = materialStr.toLowerCase();
        const wheelbaseStr = typeof data.wheelbase === 'string' ? data.wheelbase : String(data.wheelbase || '220');
        const wheelbase = parseFloat(wheelbaseStr.replace(/[^\d]/g, '') || '220');
  let framePrice = wheelbase * 0.2;
  if (material.includes('carbon')) framePrice *= 1.5;
  if (material.includes('titanium')) framePrice *= 2;
  return Math.round(framePrice) / 100;

      case 'stack':
        const processorStr = typeof data.fcProcessor === 'string' ? data.fcProcessor : String(data.fcProcessor || '');
        const processor = processorStr.toLowerCase();
        const escRatingStr = typeof data.escCurrentRating === 'string' ? data.escCurrentRating : String(data.escCurrentRating || '30');
        const escRating = parseFloat(escRatingStr.replace(/[^\d]/g, '') || '30');
  let stackPrice = escRating * 2;
  if (processor.includes('f7')) stackPrice *= 1.5;
  if (processor.includes('f4')) stackPrice *= 1.2;
  return Math.round(stackPrice);

      case 'camera':
        const resolutionStr = typeof data.resolution === 'string' ? data.resolution : String(data.resolution || '');
        const resolution = resolutionStr.toLowerCase();
  let cameraPrice = 25;
  if (resolution.includes('4k')) cameraPrice = 45;
  if (resolution.includes('1080p')) cameraPrice = 30;
  if (resolution.includes('720p')) cameraPrice = 20;
  return cameraPrice;

      case 'prop':
        const sizeStr = typeof data.size === 'string' ? data.size : String(data.size || '5');
        const propSize = parseFloat(sizeStr.replace(/[^\d.]/g, '') || '5');
        const materialPropStr = typeof data.material === 'string' ? data.material : String(data.material || '');
        const material_prop = materialPropStr.toLowerCase();
  let propPrice = propSize * 0.8;
  if (material_prop.includes('carbon')) propPrice *= 2;
  return Math.round(propPrice) ;

      case 'battery':
        const capacityStr = typeof data.capacity === 'string' ? data.capacity : String(data.capacity || '1300');
        const capacity = parseFloat(capacityStr.replace(/[^\d]/g, '') || '1300');
        const voltageStr = typeof data.voltage === 'string' ? data.voltage : String(data.voltage || '4S');
        const voltage = voltageStr;
        const cells = parseFloat(voltage.replace(/[^\d]/g, '') || '4');
        return Math.round((capacity / 100) * cells * 0.5);

      case 'customWeight':
  return data.price || 5;

      default:
        return 0;
    }
  }