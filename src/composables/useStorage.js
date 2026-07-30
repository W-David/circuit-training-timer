const STORAGE_KEY = 'ct3-data'

export function load(key = STORAGE_KEY) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function save(key = STORAGE_KEY, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* quota exceeded */ }
}

export function remove(key = STORAGE_KEY) {
  try {
    localStorage.removeItem(key)
  } catch { /* ignore */ }
}
