// Jest mock for three/examples/jsm/loaders/GLTFLoader
export class GLTFLoader {
  load(_url, onLoad) {
    // Provide a minimal gltf-like object
    const scene = { position: { set: () => {} }, rotation: { set: () => {} }, scale: { set: () => {} } };
    onLoad({ scene });
  }
}
