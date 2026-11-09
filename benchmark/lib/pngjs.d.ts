// the subset of pngjs (a transitive dependency, via get-pixels) used by the real pages experiment
declare module 'pngjs' {
  export const PNG: { sync: { read: (buffer: Buffer) => { width: number, height: number, data: Buffer } } }
}
