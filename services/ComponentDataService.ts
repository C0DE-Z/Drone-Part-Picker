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

/**
 * Data service for managing drone component data
 * This replaces the old JSON-based approach with a proper TypeScript structure
 */
export class ComponentDataService {
  private static instance: ComponentDataService;
  private componentsData: DroneComponents;

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

  /**
   * Get singleton instance
   */
  public static getInstance(): ComponentDataService {
    if (!ComponentDataService.instance) {
      ComponentDataService.instance = new ComponentDataService();
    }
    return ComponentDataService.instance;
  }

  /**
   * Get all components data
   */
  public getAllComponents(): DroneComponents {
    return this.componentsData;
  }

  /**
   * Get components by type
   */
  public getComponentsByType<T>(type: keyof DroneComponents): Record<string, T> {
    return this.componentsData[type] as Record<string, T>;
  }

  /**
   * Get a specific component by type and name
   */
  public getComponent<T>(type: keyof DroneComponents, name: string): T | undefined {
    return this.componentsData[type][name] as T;
  }

  /**
   * Add a new component
   */
  public addComponent<T extends ComponentType>(type: keyof DroneComponents, name: string, component: T): void {
    (this.componentsData[type] as Record<string, T>)[name] = component;
  }

  /**
   * Update an existing component
   */
  public updateComponent<T extends ComponentType>(type: keyof DroneComponents, name: string, component: T): boolean {
    if (this.componentsData[type][name]) {
      (this.componentsData[type] as Record<string, T>)[name] = component;
      return true;
    }
    return false;
  }

  /**
   * Remove a component
   */
  public removeComponent(type: keyof DroneComponents, name: string): boolean {
    if (this.componentsData[type][name]) {
      delete this.componentsData[type][name];
      return true;
    }
    return false;
  }

  /**
   * Search components by name across all types
   */
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

  /**
   * Get component count by type
   */
  public getComponentCount(type: keyof DroneComponents): number {
    return Object.keys(this.componentsData[type]).length;
  }

  /**
   * Get total component count
   */
  public getTotalComponentCount(): number {
    return Object.values(this.componentsData).reduce(
      (total, components) => total + Object.keys(components).length,
      0
    );
  }

  /**
   * Validate component data structure
   */
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
