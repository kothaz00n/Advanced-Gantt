export function getMidpoints(intervals: Date[], end: Date, xScale: any): { date: Date; pos: number }[] {
  const extended = [...intervals];
  if (+extended[extended.length - 1] < +end) {
    extended.push(new Date(end));
  }

  return extended.slice(0, -1).map((start, i) => {
    const stop = extended[i + 1];
    return {
      date: new Date((start.getTime() + stop.getTime()) / 2),
      pos: (xScale(start) + xScale(stop)) / 2
    };
  });
}
