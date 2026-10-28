declare module 'file-bytes' {
  interface FileBytes {
    (filename: string): Promise<number>
    sync: (filename: string) => number
  }

  const fileBytes: FileBytes
  export = fileBytes
}
