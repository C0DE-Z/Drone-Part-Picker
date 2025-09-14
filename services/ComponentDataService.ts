import { DroneComponents, Motor, Frame, Stack, Camera, Prop, Battery, CustomWeight } from '@/types/drone';
import { motors } from '@/data/motors';
import { frames } from '@/data/frames';
import { stacks } from '@/data/stacks';
import { cameras } from '@/data/cameras';
import { props } from '@/data/props';
import { batteries } from '@/data/batteries';
import { customWeights } from '@/data/customWeights';

type ComponentType = Motor | Frame | Stack | Camera | Prop | Battery | CustomWeight;

interface SearchResult {
  type: keyof DroneComponents;
  name: string;
  component: ComponentType;
}

interface ScrapedProduct {
  id: string;
  name: string;
  category: string;
  brand?: string;
  description?: string;
  imageUrl?: string;
  specifications?: Record<string, unknown>;
  bestPrice?: {
    price: number;
    vendor: string;
    url: string;
    inStock: boolean;
  };
}

export class ComponentDataService {
  private static instance: ComponentDataService;
  private componentsData: DroneComponents;
  private scrapedProducts: Record<string, ScrapedProduct[]> = {};
  private lastFetch: number = 0;
  private fetchInterval: number = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // Initialize with typed data from separate files
    this.componentsData = {
      Motors: motors,
      Frames: frames,
      Stacks: stacks,
      Camera: cameras,
      Props: props,
      Batteries: batteries,
      'Simple Weight': customWeights
    };
  }

  public static getInstance(): ComponentDataService {
    if (!ComponentDataService.instance) {
      ComponentDataService.instance = new ComponentDataService();
    }
    return ComponentDataService.instance;
  }

  private async fetchScrapedProducts(): Promise<void> {
    const now = Date.now();
    if (now - this.lastFetch < this.fetchInterval) {
      return; // Don't fetch too frequently
    }

    try {
      // Fetch products by category to get all available products
      const categories = ['motor', 'frame', 'stack', 'camera', 'prop', 'battery'];
      const allProducts: ScrapedProduct[] = [];

      for (const category of categories) {
        const response = await fetch(`/api/products/search?category=${category}&limit=200`);
        if (response.ok) {
          const data = await response.json();
          allProducts.push(...data.products);
        }
      }
      
      // Group products by category
      this.scrapedProducts = {};
      allProducts.forEach(product => {
        const category = this.mapCategoryToComponentType(product.category);
        if (category) {
          if (!this.scrapedProducts[category]) {
            this.scrapedProducts[category] = [];
          }
          this.scrapedProducts[category].push(product);
        }
      });
      
      this.lastFetch = now;
      console.log(`Fetched ${allProducts.length} scraped products across ${Object.keys(this.scrapedProducts).length} categories`);
    } catch (error) {
      console.error('Failed to fetch scraped products:', error);
    }
  }

  private mapCategoryToComponentType(category: string): keyof DroneComponents | null {
    const mapping: Record<string, keyof DroneComponents> = {
      'motor': 'Motors',
      'motors': 'Motors',
      'frame': 'Frames',
      'frames': 'Frames',
      'stack': 'Stacks',
      'stacks': 'Stacks',
      'flight-controller': 'Stacks',
      'camera': 'Camera',
      'cameras': 'Camera',
      'prop': 'Props',
      'props': 'Props',
      'propeller': 'Props',
      'propellers': 'Props',
      'battery': 'Batteries',
      'batteries': 'Batteries',
      'lipo': 'Batteries'
    };
    
    return mapping[category.toLowerCase()] || null;
  }

  private convertScrapedToComponent(product: ScrapedProduct, type: keyof DroneComponents): ComponentType {
    const specs = product.specifications || {};
    const baseComponent = {
      name: product.name,
      brand: product.brand,
      description: product.description,
      imageUrl: product.imageUrl,
      price: product.bestPrice?.price,
      vendor: product.bestPrice?.vendor,
      vendorUrl: product.bestPrice?.url,
      inStock: product.bestPrice?.inStock,
    };

    switch (type) {
      case 'Motors':
        return {
          statorSize: (specs.statorSize as string) || (specs.stator as string) || '2207',
          kv: (specs.kv as number) || 2400,
          voltageCompatibility: (specs.voltage as string) || (specs.voltageCompatibility as string) || '4-6S LiPo',
          weight: (specs.weight as string) || 'Unknown',
          maxThrust: (specs.maxThrust as string) || 'Unknown',
          propCompatibility: (specs.propCompatibility as string) || '5-inch',
          shaftDiameter: (specs.shaftDiameter as string) || '5mm',
          bearings: (specs.bearings as string) || 'Standard',
          magnetType: (specs.magnetType as string) || 'N52H',
          wireGauge: (specs.wireGauge as string) || '20AWG',
          ...baseComponent
        } as Motor;

      case 'Frames':
        return {
          type: (specs.type as string) || '5-inch',
          weight: (specs.weight as string) || 'Unknown',
          wheelbase: (specs.wheelbase as string) || '225mm',
          material: (specs.material as string) || 'Carbon Fiber',
          thickness: (specs.thickness as string) || '4mm',
          motorMounting: (specs.motorMounting as string) || '16x16mm, M3',
          stackMounting: (specs.stackMounting as string) || '30.5x30.5mm, M3',
          propellerSizeCompatibility: (specs.propellerSizeCompatibility as string) || '5-inch',
          armThickness: (specs.armThickness as string) || '4mm',
          topPlateThickness: (specs.topPlateThickness as string) || '2mm',
          bottomPlateThickness: (specs.bottomPlateThickness as string) || '2mm',
          cameraMount: (specs.cameraMount as string) || 'Standard',
          ...baseComponent
        } as Frame;

      case 'Stacks':
        return {
          type: (specs.type as string) || 'FC + ESC Stack',
          fcProcessor: (specs.fcProcessor as string) || (specs.processor as string) || 'F7',
          escCurrentRating: (specs.escCurrentRating as string) || (specs.current as string) || '45A',
          mountingSize: (specs.mountingSize as string) || '30.5x30.5mm',
          firmwareCompatibility: (specs.firmwareCompatibility as string[]) || ['Betaflight'],
          inputVoltage: (specs.inputVoltage as string) || '3-6S LiPo',
          gyro: (specs.gyro as string) || 'ICM-42688-P',
          osd: (specs.osd as string) || 'AT7456E',
          bluetooth: (specs.bluetooth as string) || 'No',
          voltageInput: (specs.voltageInput as string) || '3-6S LiPo',
          ...baseComponent
        } as Stack;

      case 'Camera':
        return {
          type: (specs.type as string) || 'FPV Camera',
          sensor: (specs.sensor as string) || 'CMOS',
          resolution: (specs.resolution as string) || '1200TVL',
          format: (specs.format as string) || 'PAL/NTSC',
          fov: (specs.fov as string) || '160°',
          weight: (specs.weight as string) || 'Unknown',
          mounting: (specs.mounting as string) || 'Standard 14x14mm',
          aspectRatio: (specs.aspectRatio as string) || '16:9',
          lens: (specs.lens as string) || '2.1mm',
          voltageInput: (specs.voltageInput as string) || '5V',
          ...baseComponent
        } as Camera;

      case 'Props':
        return {
          size: (specs.size as string) || '5x4.3x3',
          pitch: (specs.pitch as string) || '4.3',
          blades: (specs.blades as number) || 3,
          material: (specs.material as string) || 'Polycarbonate',
          weight: (specs.weight as string) || 'Unknown',
          hubDiameter: (specs.hubDiameter as string) || '5mm',
          hubID: (specs.hubID as string) || '5mm',
          recommendedMotorSize: (specs.recommendedMotorSize as string) || '2207',
          ...baseComponent
        } as Prop;

      case 'Batteries':
        return {
          cells: (specs.cells as number) || (specs.s as number) || 4,
          capacity: (specs.capacity as string) || '1500mAh',
          cRating: (specs.cRating as string) || (specs.c as string) || '100C',
          maxCRating: (specs.maxCRating as number) || 200,
          voltage: (specs.voltage as string) || '14.8V',
          weight: (specs.weight as string) || 'Unknown',
          connector: (specs.connector as string) || 'XT60',
          dimensions: (specs.dimensions as string) || 'Unknown',
          ...baseComponent
        } as Battery;

      default:
        return {
          weight: (specs.weight as string) || 'Unknown',
          category: 'Custom',
          ...baseComponent
        } as CustomWeight;
    }
  }

  public async getAllComponents(): Promise<DroneComponents> {
    await this.fetchScrapedProducts();
    
    const enhancedComponents: DroneComponents = { ...this.componentsData };
    
    // Merge scraped products with default components
    Object.keys(enhancedComponents).forEach(componentType => {
      const type = componentType as keyof DroneComponents;
      const scrapedForType = this.scrapedProducts[type] || [];
      
      scrapedForType.forEach(product => {
        const convertedComponent = this.convertScrapedToComponent(product, type);
        enhancedComponents[type][product.name] = convertedComponent;
      });
    });
    
    return enhancedComponents;
  }

  public async getComponentsByType<T>(type: keyof DroneComponents): Promise<Record<string, T>> {
    await this.fetchScrapedProducts();
    
    const defaultComponents = this.componentsData[type] as Record<string, T>;
    const scrapedForType = this.scrapedProducts[type] || [];
    
    const enhancedComponents = { ...defaultComponents };
    
    scrapedForType.forEach(product => {
      const convertedComponent = this.convertScrapedToComponent(product, type);
      enhancedComponents[product.name] = convertedComponent as T;
    });
    
    return enhancedComponents;
  }

  public getAllComponentsSync(): DroneComponents {
    return this.componentsData;
  }

  public getComponent<T>(type: keyof DroneComponents, name: string): T | undefined {
    return this.componentsData[type][name] as T;
  }

  public addComponent<T extends ComponentType>(type: keyof DroneComponents, name: string, component: T): void {
    (this.componentsData[type] as Record<string, T>)[name] = component;
  }

  public updateComponent<T extends ComponentType>(type: keyof DroneComponents, name: string, component: T): boolean {
    if (this.componentsData[type][name]) {
      (this.componentsData[type] as Record<string, T>)[name] = component;
      return true;
    }
    return false;
  }

  public removeComponent(type: keyof DroneComponents, name: string): boolean {
    if (this.componentsData[type][name]) {
      delete this.componentsData[type][name];
      return true;
    }
    return false;
  }

  public searchComponents(query: string): SearchResult[] {
    const results: SearchResult[] = [];
    
    Object.entries(this.componentsData).forEach(([type, components]) => {
      Object.entries(components).forEach(([name, component]) => {
        if (name.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            type: type as keyof DroneComponents,
            name,
            component: component as ComponentType
          });
        }
      });
    });

    return results;
  }

  public getComponentCount(type: keyof DroneComponents): number {
    return Object.keys(this.componentsData[type]).length;
  }

  public getTotalComponentCount(): number {
    return Object.values(this.componentsData).reduce(
      (total, components) => total + Object.keys(components).length,
      0
    );
  }

  public validateComponent(type: keyof DroneComponents, component: ComponentType): boolean {
    // Add validation logic based on component type
    switch (type) {
      case 'Motors':
        return this.validateMotor(component as Motor);
      case 'Frames':
        return this.validateFrame(component as Frame);
      case 'Stacks':
        return this.validateStack(component as Stack);
      // Add other component validations...
      default:
        return true;
    }
  }

  private validateMotor(motor: Motor): boolean {
    const requiredFields: (keyof Motor)[] = ['statorSize', 'kv', 'voltageCompatibility', 'weight', 'maxThrust'];
    return requiredFields.every(field => motor.hasOwnProperty(field));
  }

  private validateFrame(frame: Frame): boolean {
    const requiredFields: (keyof Frame)[] = ['type', 'weight', 'wheelbase', 'material'];
    return requiredFields.every(field => frame.hasOwnProperty(field));
  }

  private validateStack(stack: Stack): boolean {
    const requiredFields: (keyof Stack)[] = ['type', 'fcProcessor', 'escCurrentRating', 'mountingSize'];
    return requiredFields.every(field => stack.hasOwnProperty(field));
  }
}

// Export convenience function for getting the service instance
export const getComponentDataService = () => ComponentDataService.getInstance();
