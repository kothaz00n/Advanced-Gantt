import * as d3 from "d3";

interface LabelOptions {
  svg: d3.Selection<SVGGElement, unknown, null, undefined>;
  bars: {
    id: string;
    start: Date;
    end: Date;
    rowKey: string;
  }[];
  x: d3.ScaleTime<number, number>;
  y: d3.ScaleBand<string>;
  yOffset: number;
  barHeight: number;

  // Nuevos estilos opcionales
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export function renderDurationLabels(opts: LabelOptions) {
  const {
    svg, bars, x, y, yOffset, barHeight,
    fontFamily = "Segoe UI",
    fontSize = 11,
    fontColor = "#000000",
    bold = false,
    italic = false,
    underline = false
  } = opts;

  svg.selectAll(".duration-label").remove();

  const formatDuration = (start: Date, end: Date, label: string) => {
    const ms = end.getTime() - start.getTime();
    const minutes = Math.floor(ms / 60_000);  
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;

    let durText = "";

    if (minutes < 60) {
      durText = `${minutes}m`;
    } else if (days > 0) {
      durText = `${days}d ${remHours}h`;
    } else {
      durText = `${hours}h`;
    }

    return `${label} (${durText})`;
  };

  svg.selectAll(".duration-label")
    .data(bars.filter(d =>
      d.start instanceof Date &&
      !isNaN(d.start.getTime()) &&
      d.end instanceof Date &&
      !isNaN(d.end.getTime())
    ))
    .join("text")
    .attr("class", "duration-label")
    .text(d => formatDuration(d.start, d.end, d.id))
    .attr("data-rowKey", d => d.rowKey)
    .attr("x", d => {
      const endX = x(d.end);
      return isNaN(endX) ? -9999 : endX + 4;
    })
    .attr("y", d => y(d.rowKey)! + yOffset + barHeight / 2 + 4)
    .attr("text-anchor", "start")
    .attr("dominant-baseline", "middle")
    .attr("font-size", fontSize)
    .attr("font-family", fontFamily)
    .attr("fill", fontColor)
    .attr("font-weight", bold ? "bold" : "normal")
    .attr("font-style", italic ? "italic" : "normal")
    .attr("text-decoration", underline ? "underline" : "none");
}
