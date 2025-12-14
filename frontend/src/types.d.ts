declare module 'colorthief' {
  class ColorThief {
    getColor(img: HTMLImageElement | HTMLCanvasElement, quality?: number): [number, number, number];
    getPalette(img: HTMLImageElement | HTMLCanvasElement, colorCount?: number, quality?: number): Array<[number, number, number]>;
  }
  export default ColorThief;
}