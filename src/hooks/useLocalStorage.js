import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useState that persists to localStorage (safe against private mode / quota errors).
 * Supports functional updates like React's setState.
 */
export function useLocalStorage(key, initialValue) {
  const read = () => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw);
    } catch {
      /* ignore corrupt or blocked storage */
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue;
  };

  const [value, setValue] = useState(read);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable - keep in memory only */
    }
  }, [key, value]);

  const set = useCallback((next) => {
    setValue((prev) => (typeof next === 'function' ? next(prev) : next));
  }, []);

  return [value, set];
}
