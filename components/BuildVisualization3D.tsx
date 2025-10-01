"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCw, 
  Move3d,
  Eye,
  EyeOff,
  Layers,
  Play,
  Pause,
  Camera,
  Settings,
  Maximize,
  Minimize,
  Grid3x3,
  Box,
  Wrench,
  Info,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Zap
} from 'lucide-react';
import { cacheService } from '@/lib/simple-cache';
// three.js imports for real 3D rendering
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import ModelImportModal from './ModelImportModal';

interface Component3D {
  id: string;
  name: string;
  type: 'frame' | 'motor' | 'prop' | 'battery' | 'camera' | 'stack' | 'other';
  modelUrl?: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  opacity: number;
  visible: boolean;
  metadata: {
    dimensions: [number, number, number];
    weight: number;
    material?: string;
    mountingPoints?: Array<{ position: [number, number, number]; type: string }>;
  };
}

interface Build3D {
  id: string;
  name: string;
  components: Component3D[];
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
  };
  environment: {
    background: string;
    lighting: 'studio' | 'outdoor' | 'indoor' | 'dark';
    showGrid: boolean;
    showAxes: boolean;
  };
  animation?: {
    type: 'assembly' | 'rotation' | 'explosion';
    duration: number;
    steps: Array<{
      component: string;
      delay: number;
      animation: 'fadeIn' | 'slideIn' | 'rotate';
      duration: number;
    }>;
  };
}

interface ViewMode {
  id: string;
  name: string;
  description: string;
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  icon: React.ReactNode;
}

interface BuildVisualization3DProps {
  buildId?: string;
  components?: Component3D[];
  onComponentSelect?: (component: Component3D) => void;
  onBuildUpdate?: (build: Build3D) => void;
  editable?: boolean;
  showAssemblyAnimation?: boolean;
}

export default function BuildVisualization3D({ 
  buildId, 
  components = [], 
  onComponentSelect, 
  onBuildUpdate, 

  showAssemblyAnimation = true 
}: BuildVisualization3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const objectsRef = useRef<Record<string, THREE.Object3D>>({});
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const axesRef = useRef<THREE.AxesHelper | null>(null);
  const rafRef = useRef<number | null>(null);
  const [currentBuild, setCurrentBuild] = useState<Build3D | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component3D | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [, setAnimationStep] = useState(0);
  const [viewMode, setViewMode] = useState('perspective');
  const [showWireframe, setShowWireframe] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const [showCompatibilityCheck, setShowCompatibilityCheck] = useState(false);
  const [assemblyProgress, setAssemblyProgress] = useState(0);

  const viewModes: ViewMode[] = [
    {
      id: 'perspective',
      name: 'Perspective',
      description: 'Natural 3D perspective view',
      camera: { position: [5, 5, 5], target: [0, 0, 0] },
      icon: <Box className="w-4 h-4" />
    },
    {
      id: 'top',
      name: 'Top View',
      description: 'View from above',
      camera: { position: [0, 10, 0], target: [0, 0, 0] },
      icon: <Grid3x3 className="w-4 h-4" />
    },
    {
      id: 'front',
      name: 'Front View',
      description: 'View from front',
      camera: { position: [0, 0, 10], target: [0, 0, 0] },
      icon: <Eye className="w-4 h-4" />
    },
    {
      id: 'side',
      name: 'Side View',
      description: 'View from side',
      camera: { position: [10, 0, 0], target: [0, 0, 0] },
      icon: <Move3d className="w-4 h-4" />
    }
  ];

  useEffect(() => {
    initializeBuild();
    if (showAssemblyAnimation) {
      startAssemblyAnimation();
    }
  }, [buildId, components]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    initializeRenderer();
    return () => {
      // Cleanup renderer resources
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      controlsRef.current?.dispose();
      rendererRef.current?.dispose();
      sceneRef.current?.traverse((obj: THREE.Object3D) => {
        const mesh = obj as THREE.Mesh;
        const geom = (mesh.geometry as unknown) as (THREE.BufferGeometry | undefined);
        const mat = (mesh.material as unknown) as (THREE.Material | THREE.Material[] | undefined);
        if (geom && 'dispose' in geom) geom.dispose();
        if (mat) {
          if (Array.isArray(mat)) mat.forEach(m => ('dispose' in m) && m.dispose());
          else if ('dispose' in mat) mat.dispose();
        }
      });
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      rendererRef.current = null;
      objectsRef.current = {};
    };
  }, []);

  const initializeBuild = async () => {
    setLoading(true);
    try {
      let build: Build3D;
      
      if (buildId) {
        const cached = cacheService.get<Build3D>(`build3d:${buildId}`);
        if (cached) {
          build = cached;
        } else {
          build = await generateMockBuild(buildId);
          cacheService.set(`build3d:${buildId}`, build, 1800); // Cache for 30 minutes
        }
      } else {
        build = generateBuildFromComponents(components);
      }
      
      setCurrentBuild(build);
      setAssemblyProgress(0);
    } catch (error) {
      console.error('Failed to initialize build:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockBuild = async (id: string): Promise<Build3D> => {
    // Generate comprehensive 3D build with realistic component positioning
    const mockComponents: Component3D[] = [
      {
        id: 'frame-1',
        name: 'Carbon Fiber 5" Frame',
        type: 'frame',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#2d2d2d',
        opacity: 0.9,
        visible: true,
        metadata: {
          dimensions: [200, 200, 30],
          weight: 85,
          material: 'Carbon Fiber',
          mountingPoints: [
            { position: [0.5, 0, 0.5], type: 'motor' },
            { position: [-0.5, 0, 0.5], type: 'motor' },
            { position: [0.5, 0, -0.5], type: 'motor' },
            { position: [-0.5, 0, -0.5], type: 'motor' }
          ]
        }
      },
      {
        id: 'motor-1',
        name: 'Motor Front Right',
        type: 'motor',
        position: [0.75, -0.2, 0.75],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#4a5568',
        opacity: 1,
        visible: true,
        metadata: {
          dimensions: [28, 28, 18],
          weight: 32,
          material: 'Aluminum'
        }
      },
      {
        id: 'motor-2',
        name: 'Motor Front Left',
        type: 'motor',
        position: [-0.75, -0.2, 0.75],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#4a5568',
        opacity: 1,
        visible: true,
        metadata: {
          dimensions: [28, 28, 18],
          weight: 32,
          material: 'Aluminum'
        }
      },
      {
        id: 'motor-3',
        name: 'Motor Rear Right',
        type: 'motor',
        position: [0.75, -0.2, -0.75],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#4a5568',
        opacity: 1,
        visible: true,
        metadata: {
          dimensions: [28, 28, 18],
          weight: 32,
          material: 'Aluminum'
        }
      },
      {
        id: 'motor-4',
        name: 'Motor Rear Left',
        type: 'motor',
        position: [-0.75, -0.2, -0.75],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#4a5568',
        opacity: 1,
        visible: true,
        metadata: {
          dimensions: [28, 28, 18],
          weight: 32,
          material: 'Aluminum'
        }
      },
      {
        id: 'battery-1',
        name: '4S LiPo Battery',
        type: 'battery',
        position: [0, -0.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#ffd700',
        opacity: 1,
        visible: true,
        metadata: {
          dimensions: [105, 35, 25],
          weight: 245,
          material: 'Polymer'
        }
      },
      {
        id: 'camera-1',
        name: 'FPV Camera',
        type: 'camera',
        position: [0, 0.2, 1.2],
        rotation: [15, 0, 0],
        scale: [1, 1, 1],
        color: '#1a1a1a',
        opacity: 1,
        visible: true,
        metadata: {
          dimensions: [19, 19, 18],
          weight: 8,
          material: 'Plastic'
        }
      },
      {
        id: 'stack-1',
        name: 'Flight Stack',
        type: 'stack',
        position: [0, 0.3, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#2563eb',
        opacity: 1,
        visible: true,
        metadata: {
          dimensions: [30, 30, 15],
          weight: 12,
          material: 'PCB'
        }
      }
    ];

    return {
      id,
      name: 'Racing Quad Build',
      components: mockComponents,
      camera: {
        position: [3, 2, 3],
        target: [0, 0, 0],
        fov: 75
      },
      environment: {
        background: 'gradient',
        lighting: 'studio',
        showGrid: true,
        showAxes: false
      },
      animation: {
        type: 'assembly',
        duration: 5000,
        steps: mockComponents.map((comp, index) => ({
          component: comp.id,
          delay: index * 600,
          animation: 'slideIn',
          duration: 800
        }))
      }
    };
  };

  const generateBuildFromComponents = (comps: Component3D[]): Build3D => {
    return {
      id: 'custom-build',
      name: 'Custom Build',
      components: comps,
      camera: {
        position: [3, 2, 3],
        target: [0, 0, 0],
        fov: 75
      },
      environment: {
        background: 'gradient',
        lighting: 'studio',
        showGrid: true,
        showAxes: false
      }
    };
  };

  const initializeRenderer = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null; // gradient via CSS
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.01, 1000);
    camera.position.set(3, 2, 3);
    cameraRef.current = camera;

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 1.0);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(5, 10, 7.5);
    scene.add(dir);

    // Helpers
    const grid = new THREE.GridHelper(10, 20, 0x444444, 0x888888);
    grid.position.y = -0.6;
    scene.add(grid);
    gridRef.current = grid;
    const axes = new THREE.AxesHelper(1);
    axes.visible = false;
    scene.add(axes);
    axesRef.current = axes;

    // Controls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    const onResize = () => {
      if (!canvasRef.current || !rendererRef.current || !cameraRef.current) return;
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      rendererRef.current.setSize(width, height, false);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    setLoading(false);
  };

  // Map Build3D components into basic three.js placeholders or load GLTF models
  useEffect(() => {
    if (!currentBuild || !sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove previous object meshes
    Object.values(objectsRef.current).forEach((obj) => {
      scene.remove(obj);
    });
    objectsRef.current = {};

    const loader = new GLTFLoader();

    currentBuild.components.forEach((comp) => {
      if (!comp.visible) return;
      if (comp.modelUrl) {
        // Attempt to load external model
        try {
          loader.load(
            comp.modelUrl,
            (gltf: GLTF) => {
              const root = gltf.scene;
              root.position.set(comp.position[0], comp.position[1], comp.position[2]);
              root.rotation.set(
                THREE.MathUtils.degToRad(comp.rotation[0]),
                THREE.MathUtils.degToRad(comp.rotation[1]),
                THREE.MathUtils.degToRad(comp.rotation[2])
              );
              root.scale.set(comp.scale[0], comp.scale[1], comp.scale[2]);
              scene.add(root);
              objectsRef.current[comp.id] = root;
            },
            undefined,
            () => {
              // Fallback to placeholder if load fails
              const placeholder = createPlaceholder(comp);
              scene.add(placeholder);
              objectsRef.current[comp.id] = placeholder;
            }
          );
        } catch {
          const placeholder = createPlaceholder(comp);
          scene.add(placeholder);
          objectsRef.current[comp.id] = placeholder;
        }
      } else {
        const placeholder = createPlaceholder(comp);
        scene.add(placeholder);
        objectsRef.current[comp.id] = placeholder;
      }
    });

    function createPlaceholder(comp: Component3D): THREE.Object3D {
      const color = new THREE.Color(comp.color || '#888888');
      const opacity = comp.opacity ?? 1;
      let geom: THREE.BufferGeometry;
      switch (comp.type) {
        case 'motor':
          geom = new THREE.CylinderGeometry(0.12, 0.12, 0.2, 24);
          break;
        case 'battery':
          geom = new THREE.BoxGeometry(0.9, 0.35, 0.25);
          break;
        case 'camera':
          geom = new THREE.BoxGeometry(0.19, 0.19, 0.18);
          break;
        case 'stack':
          geom = new THREE.BoxGeometry(0.3, 0.15, 0.3);
          break;
        case 'prop':
          geom = new THREE.TorusGeometry(0.12, 0.02, 8, 24);
          break;
        case 'frame':
          geom = new THREE.BoxGeometry(1.8, 0.05, 1.8);
          break;
        default:
          geom = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      }
      const mat = new THREE.MeshStandardMaterial({ color, transparent: opacity < 1, opacity });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(comp.position[0], comp.position[1], comp.position[2]);
      mesh.rotation.set(
        THREE.MathUtils.degToRad(comp.rotation[0]),
        THREE.MathUtils.degToRad(comp.rotation[1]),
        THREE.MathUtils.degToRad(comp.rotation[2])
      );
      mesh.scale.set(comp.scale[0], comp.scale[1], comp.scale[2]);
      return mesh;
    }

    // Apply wireframe state
    applyWireframe(showWireframe);
  }, [currentBuild, showWireframe]);

  function applyWireframe(enabled: boolean) {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.traverse((obj: THREE.Object3D) => {
      const matUnknown = (obj as THREE.Mesh).material as unknown;
      if (!matUnknown) return;
      if (Array.isArray(matUnknown)) (matUnknown as THREE.Material[]).forEach((m) => ((m as THREE.MeshStandardMaterial).wireframe = enabled));
      else ((matUnknown as THREE.MeshStandardMaterial).wireframe = enabled);
    });
  }

  const startAssemblyAnimation = () => {
    if (!currentBuild?.animation) return;
    
    setIsAnimating(true);
    setAnimationStep(0);
    setAssemblyProgress(0);
    
    const animation = currentBuild.animation;
    let currentStep = 0;
    
    const animateStep = () => {
      if (currentStep >= animation.steps.length) {
        setIsAnimating(false);
        setAssemblyProgress(100);
        return;
      }
      
      const step = animation.steps[currentStep];
      setAnimationStep(currentStep);
      setAssemblyProgress((currentStep / animation.steps.length) * 100);
      
      setTimeout(() => {
        currentStep++;
        animateStep();
      }, step.delay + step.duration);
    };
    
    setTimeout(animateStep, 500);
  };

  const handleComponentClick = (component: Component3D) => {
    setSelectedComponent(component);
    onComponentSelect?.(component);
  };

  const handleViewModeChange = (mode: string) => {
    setViewMode(mode);
    const view = viewModes.find(v => v.id === mode);
    if (view && currentBuild) {
      const updatedBuild = {
        ...currentBuild,
        camera: {
          ...currentBuild.camera,
          position: view.camera.position,
          target: view.camera.target
        }
      };
      setCurrentBuild(updatedBuild);
      // Apply to three camera
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(view.camera.position[0], view.camera.position[1], view.camera.position[2]);
        controlsRef.current.target.set(view.camera.target[0], view.camera.target[1], view.camera.target[2]);
        controlsRef.current.update();
      }
    }
  };

  const toggleComponentVisibility = (componentId: string) => {
    if (!currentBuild) return;
    
    const updatedBuild = {
      ...currentBuild,
      components: currentBuild.components.map(comp =>
        comp.id === componentId ? { ...comp, visible: !comp.visible } : comp
      )
    };
    
    setCurrentBuild(updatedBuild);
    onBuildUpdate?.(updatedBuild);
    // Also toggle visibility in scene if present
    const obj = objectsRef.current[componentId];
    if (obj) obj.visible = !obj.visible;
  };

  const exportScreenshot = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `${currentBuild?.name || 'build'}-screenshot.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const checkCompatibility = () => {
    setShowCompatibilityCheck(true);
    // Mock compatibility analysis
    setTimeout(() => {
      setShowCompatibilityCheck(false);
    }, 2000);
  };

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'frame': return <Box className="w-4 h-4" />;
      case 'motor': return <RotateCw className="w-4 h-4" />;
      case 'battery': return <Zap className="w-4 h-4" />;
      case 'camera': return <Camera className="w-4 h-4" />;
      case 'stack': return <Layers className="w-4 h-4" />;
      default: return <Wrench className="w-4 h-4" />;
    }
  };

  const onSelectModelUrl = (modelUrl: string) => {
    setImportModalOpen(false);
    if (!selectedComponent || !currentBuild) return;
    const updatedBuild: Build3D = {
      ...currentBuild,
      components: currentBuild.components.map(c => c.id === selectedComponent.id ? { ...c, modelUrl } : c)
    };
    setCurrentBuild(updatedBuild);
    onBuildUpdate?.(updatedBuild);
  };

  const getCompatibilityStatus = () => {
    // Mock compatibility check
    const compatibility = Math.random();
    if (compatibility > 0.8) {
      return { status: 'compatible', message: 'Fully compatible' };
    } else if (compatibility > 0.5) {
      return { status: 'warning', message: 'May have compatibility issues' };
    } else {
      return { status: 'incompatible', message: 'Not compatible' };
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading 3D visualization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Box className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {currentBuild?.name || 'Build Visualization'}
              </h3>
              <p className="text-sm text-gray-600">
                {currentBuild?.components.length || 0} components
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={checkCompatibility}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              title="Check Compatibility"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
            
            <button
              onClick={exportScreenshot}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              title="Export Screenshot"
            >
              <Camera className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Assembly Progress */}
        {isAnimating && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Assembly Animation</span>
              <span>{Math.round(assemblyProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${assemblyProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex h-96">
        {/* 3D Viewport */}
        <div className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing block"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          />

          {/* Measurements overlay */}
          {showMeasurements && (
            <div className="absolute bottom-4 right-4 bg-white/90 rounded px-3 py-2 text-xs text-gray-700 shadow">
              <div>Grid: 10m</div>
              <div>Camera: {cameraRef.current ? cameraRef.current.position.toArray().map((n: number)=>n.toFixed(2)).join(', ') : '—'}</div>
            </div>
          )}
          
          {/* Viewport Controls */}
          <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-2 space-y-1">
            <button
              onClick={() => handleViewModeChange('perspective')}
              className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                viewMode === 'perspective' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Perspective View"
            >
              <Box className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('top')}
              className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                viewMode === 'top' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Top View"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('front')}
              className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                viewMode === 'front' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Front View"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          
          {/* Animation Controls */}
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-2 flex items-center gap-2">
            <button
              onClick={startAssemblyAnimation}
              disabled={isAnimating}
              className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 transition-colors"
              title="Play Assembly Animation"
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsAnimating(false)}
              disabled={!isAnimating}
              className="p-2 text-gray-600 hover:text-red-600 disabled:opacity-50 transition-colors"
              title="Stop Animation"
            >
              <Pause className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowWireframe(!showWireframe)}
              className={`p-2 transition-colors ${
                showWireframe ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
              }`}
              title="Toggle Wireframe"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                // Toggle helpers
                if (gridRef.current) gridRef.current.visible = !gridRef.current.visible;
                if (axesRef.current) axesRef.current.visible = !axesRef.current.visible;
              }}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              title="Toggle Grid/Axes"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
          
          {/* View Settings */}
          <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg p-2 space-y-1">
            <button
              onClick={() => setShowMeasurements(!showMeasurements)}
              className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                showMeasurements ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Toggle Measurements"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Component Panel */}
        <div className="w-80 border-l border-gray-200 bg-gray-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Components</h4>
              <span className="text-sm text-gray-600">
                {currentBuild?.components.length || 0} items
              </span>
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {currentBuild?.components.map((component) => {
                const compatibility = getCompatibilityStatus();
                return (
                  <div
                    key={component.id}
                    onClick={() => handleComponentClick(component)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedComponent?.id === component.id
                        ? 'bg-blue-100 border-blue-300'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    } border`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getComponentIcon(component.type)}
                        <span className="font-medium text-gray-900 text-sm">
                          {component.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {compatibility.status === 'compatible' && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        {compatibility.status === 'warning' && (
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        )}
                        {compatibility.status === 'incompatible' && (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComponentVisibility(component.id);
                          }}
                          className={`p-1 rounded transition-colors ${
                            component.visible
                              ? 'text-gray-600 hover:text-gray-800'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {component.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedComponent(component);
                            setImportModalOpen(true);
                          }}
                          className="p-1 rounded text-gray-600 hover:text-blue-600"
                          title="Import 3D model from URL"
                        >
                          <DownloadIcon />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Weight: {component.metadata.weight}g</div>
                      <div>
                        Dimensions: {component.metadata.dimensions.join(' × ')}mm
                      </div>
                      {component.modelUrl && (
                        <div className="truncate">
                          Model: <a href={component.modelUrl} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">{component.modelUrl}</a>
                        </div>
                      )}
                      {compatibility.status !== 'compatible' && (
                        <div className={`${
                          compatibility.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {compatibility.message}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Compatibility Check Modal */}
      {showCompatibilityCheck && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analyzing Compatibility
              </h3>
              <p className="text-gray-600">
                Checking component compatibility and fitment...
              </p>
            </div>
          </div>
        </div>
      )}

      <ModelImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSelect={onSelectModelUrl}
      />
    </div>
  );
}

// Small icon component for download symbol using lucide path (to avoid extra import churn)
function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}