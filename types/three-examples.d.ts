declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, EventDispatcher, MOUSE, TOUCH } from 'three';
  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);
    object: Camera;
    domElement: HTMLElement | undefined;
    enabled: boolean;
    target: { x: number; y: number; z: number; set: (x: number, y: number, z: number) => void };
    enableDamping: boolean;
    update: () => void;
    dispose: () => void;
    mouseButtons: { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE };
    touches: { ONE: TOUCH; TWO: TOUCH };
  }
}

declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import { Loader, LoadingManager, Group, AnimationClip } from 'three';
  export interface GLTF {
    animations: AnimationClip[];
    scene: Group;
    scenes: Group[];
    cameras: any[];
    asset: object;
  }
  export class GLTFLoader extends Loader {
    constructor(manager?: LoadingManager);
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event: unknown) => void
    ): void;
  }
}
