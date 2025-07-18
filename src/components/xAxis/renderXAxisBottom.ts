import * as d3 from "d3";
import { getMidpoints } from "./getMidpoints";

export function renderXAxisBottom(ctx: any, xStart: Date, xEnd: Date): void {
  const ax = ctx.fmtSettings.axisXCard;
  let intervals: Date[] = [];
  let format: (d: Date) => string;

   
  switch (ctx.selectedFormat) {
    case "Hora":
      intervals = d3.timeHours(xStart, xEnd);
      format = d3.timeFormat("%H:%M");
      break;
    case "Día":
      intervals = d3.timeDays(xStart, xEnd);
      format = d3.timeFormat("%d");
      break;
    case "Mes":
      intervals = d3.timeMonths(xStart, xEnd);
      format = ctx.esLocale.format("%b");
      break;
    case "Año":
      intervals = d3.timeYears(xStart, xEnd);
      format = d3.timeFormat("%Y");
      break;
    case "Todo":
      intervals = d3.timeMonths(xStart, xEnd);
      format = ctx.esLocale.format("%b %Y");
      break;
  }

  const labelData = getMidpoints(intervals, xEnd, ctx.x);

  const axisBottomG = ctx.xAxisFixedG.append("g")
    .attr("class", "x-axis-bottom")
    .attr("transform", `translate(0, 58)`);

  axisBottomG.selectAll("text")
    .data(labelData)
    .enter()
    .append("text")
    .attr("x", d => d.pos)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .text(d => format(d.date))
    .attr("font-size", ax.fontSize.value)
    .attr("font-family", ax.fontFamily.value)
    .attr("fill", ax.fontColor.value.value)
    .attr("font-weight", ax.bold.value ? "bold" : "normal")
    .attr("font-style", ax.italic.value ? "italic" : "normal")
    .attr("text-decoration", ax.underline.value ? "underline" : "none");
}
