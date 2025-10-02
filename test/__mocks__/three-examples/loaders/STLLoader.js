// Jest mock for three/examples/jsm/loaders/STLLoader
export class STLLoader {
  load(_url, onLoad) {
    const geometry = {};
    onLoad(geometry);
  }
}
