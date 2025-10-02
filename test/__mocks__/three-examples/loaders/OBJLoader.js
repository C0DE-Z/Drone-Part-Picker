// Jest mock for three/examples/jsm/loaders/OBJLoader
export class OBJLoader {
  load(_url, onLoad) {
    const obj = { traverse: () => {} };
    onLoad(obj);
  }
}
