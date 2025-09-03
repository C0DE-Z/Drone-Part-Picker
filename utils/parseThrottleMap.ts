import fs from 'fs';


export function parseThrottleMapCSV(filePath: string): Array<{ time: number; throttle: number }> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split(/\r?\n/);
  const result: Array<{ time: number; throttle: number }> = [];
  for (let i = 1; i < lines.length; i++) {
    const [time, throttle] = lines[i].split(',');
    result.push({ time: parseFloat(time), throttle: parseFloat(throttle) });
  }
  return result;
}
