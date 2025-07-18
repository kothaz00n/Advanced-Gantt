import * as d3 from "d3";
import { getMidpoints } from "./getMidpoints";

export function renderXAxisTop(ctx: any, xStart: Date, xEnd: Date): void {

  const ax = ctx.fmtSettings.axisXCard;
  let intervals: Date[] = [];
  let format: ((d: Date) => string) | null = null;

   console.log(ctx.selectedFormat)
  switch (ctx.selectedFormat) {
    case "Hora":
      intervals = d3.timeHours(xStart, xEnd);
      format = d3.timeFormat("%d/%m");
      break;
    case "Día":
      intervals = d3.timeDays(xStart, xEnd);
      format = ctx.esLocale.format("%B %y");
      break;
    case "Mes":
      intervals = d3.timeYears(xStart, xEnd);
      format = d3.timeFormat("%Y");
      break;
    default:
      return;
  }

  const labelData = getMidpoints(intervals, xEnd, ctx.x);

  const axisTopG = ctx.xAxisFixedG.append("g")
    .attr("class", "x-axis-top")
    .attr("transform", `translate(0, 25)`);

  axisTopG.selectAll("text")
    .data(labelData)
    .enter()
    .append("text")
    .attr("x", d => d.pos)
    .attr("y", -13)
    .attr("text-anchor", "middle")
    .text(d => format!(d.date))
    .attr("font-size", ax.fontSize.value)
    .attr("font-family", ax.fontFamily.value)
    .attr("fill", ax.fontColor.value.value)
    .attr("font-weight", ax.bold.value ? "bold" : "normal")
    .attr("font-style", ax.italic.value ? "italic" : "normal")
    .attr("text-decoration", ax.underline.value ? "underline" : "none");
}
