// Lưu file (Blob) trong IndexedDB của trình duyệt — dùng cho CV khi chưa có backend.
// localStorage chỉ chứa được chuỗi và giới hạn ~5MB nên không hợp với file PDF/ảnh.

const DB = 'workmate'
const STORE = 'files'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const req = fn(tx.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
        tx.oncomplete = () => db.close()
      }),
  )
}

export const putFile = (id: string, blob: Blob) => run('readwrite', (s) => s.put(blob, id)).then(() => undefined)
export const getFile = (id: string) => run<Blob | undefined>('readonly', (s) => s.get(id) as IDBRequest<Blob | undefined>)
export const deleteFile = (id: string) => run('readwrite', (s) => s.delete(id)).then(() => undefined)
