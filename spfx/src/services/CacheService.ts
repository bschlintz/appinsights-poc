  /**
   * Helper function to get an item by key from session storage
   */
  const get = (key: string) => {
    try {
      const valueStr = sessionStorage.getItem(key);
      if (valueStr) {
        const val = JSON.parse(valueStr);
        if (val) {
          return !(val.expiration && Date.now() > val.expiration) ? val.payload : null;
        }
      }
      return null;
    }
    catch (error) {
      console.error(`CacheService.get error`, error);
      return null;
    }
  };

  /**
   * Helper function to set an item by key into session storage
   */
  const set = (key: string, payload: any, expiresIn: number = 1000 * 60 * 60 * 12 /* 12 hours */) => {
    try {
      const nowTicks = Date.now();
      const expiration = (expiresIn && nowTicks + expiresIn) || null;
      const cache = { payload, expiration };
      sessionStorage.setItem(key, JSON.stringify(cache));
      return get(key);
    }
    catch (error) {
      console.error(`CacheService.set error`, error);
      return null;
    }
  };

  export default { get, set };
