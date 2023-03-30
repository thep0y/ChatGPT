/*
 * Author:      thepoy
 * Email:       thepoy@163.com
 * File Name:   index.d.ts
 * Created At:  2023-03-21 20:39:18
 * Modified At: Thu Mar 30 2023
 * Modified By: thepoy
 */

declare module 'dom-to-image-more' {
  export interface DomToImage {
    toSvg: (node: Node, options?: Options) => Promise<string>
    toPng: (node: Node, options?: Options) => Promise<string>
    toJpeg: (node: Node, options?: Options) => Promise<string>
    toBlob: (node: Node, options?: Options) => Promise<Blob>
    toPixelData: (node: Node, options?: Options) => Promise<Uint8ClampedArray>
  }

  export interface Options {
    filter?: ((node: Node) => boolean) | undefined
    bgcolor?: string | undefined
    width?: number | undefined
    height?: number | undefined
    style?: React.CSSProperties | undefined
    quality?: number | undefined
    scale?: number | undefined
    imagePlaceholder?: string | undefined
    cacheBust?: boolean | undefined
  }

  export const DomToImage: DomToImage

  type DomToImage_ = DomToImage
  type Options_ = Options

  export default DomToImage

  declare global {
    namespace DomToImage {
      type Options = Options_
      type DomToImage = DomToImage_
    }

    const DomToImage: DomToImage.DomToImage
  }
}
