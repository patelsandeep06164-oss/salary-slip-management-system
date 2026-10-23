import { useEffect, useState } from "react";

function useDebounce(value, delay = 500) {
  const safeDelay =
    Number.isFinite(Number(delay)) && Number(delay) >= 0
      ? Number(delay)
      : 500;

  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedValue(value);
    }, safeDelay);

    return () => {
      clearTimeout(timerId);
    };
  }, [value, safeDelay]);

  return debouncedValue;
}

export default useDebounce;
