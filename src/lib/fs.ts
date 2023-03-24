/*
 * author   thepoy
 * file     fs.ts
 * created  2023-03-24 18:01:11
 * modified 2023-03-24 18:01:11
 */

import { invoke } from '@tauri-apps/api'

/**
 * 以指定大小(默认 8kiB)的切片保存文件。
 *
 * 因为 js 与 rust 数据类型的转换（主要是反序列化）非常耗时，
 *
 * 会阻塞主线程导致页面卡顿，使用切片后可避免。
 *
 * @param   {string}            filepath  保存的文件路径
 * @param   {Uint8Array<void>}  buffer    要保存的文件的 buffer
 *
 * @return  {Promise<void>}
 */
export const saveFile = async (filepath: string, buffer: Uint8Array, setProgress: React.Dispatch<React.SetStateAction<number>>, kiB: number = 8): Promise<void> => {
  const chunkSize = 1024 * kiB // 每个切片的大小
  const chunks = Math.ceil(buffer.length / chunkSize) // 切片数目
  let offset = 0

  for (let i = 0; i < chunks; i++) {
    const end = Math.min(offset + chunkSize, buffer.length)
    const chunk = buffer.subarray(offset, end)

    await invoke('export_to_file', {
      filepath,
      buf: Array.from(chunk),
      offset: chunk.byteOffset,
      length: chunk.length
    })

    offset += chunkSize

    const progress = Math.round((i + 1) / chunks * 100)

    setProgress(progress)
  }
}
