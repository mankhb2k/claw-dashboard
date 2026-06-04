import { useEffect, useState } from "preact/hooks";

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((v) => (v < 10 ? `0${v}` : String(v))).join(":");
}

export function useConnectionTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }

    const id = window.setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => window.clearInterval(id);
  }, [active]);

  return formatTime(seconds);
}
