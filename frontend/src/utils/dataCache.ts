class DataCache {
  private store = new Map<string, unknown>();

  get<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  set<T>(key: string, data: T): void {
    this.store.set(key, data);
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }
}

export const dataCache = new DataCache();
