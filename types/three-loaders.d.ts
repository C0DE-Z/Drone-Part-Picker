declare module 'three/examples/jsm/loaders/OBJLoader' {
  import * as THREE from 'three';
  export class OBJLoader {
    constructor();
    load(
      url: string,
      onLoad: (object: THREE.Group) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event?: unknown) => void
    ): void;
  }
}

declare module 'three/examples/jsm/loaders/STLLoader' {
  import * as THREE from 'three';
  export class STLLoader {
    constructor();
    load(
      url: string,
      onLoad: (geometry: THREE.BufferGeometry) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event?: unknown) => void
    ): void;
  }
}
