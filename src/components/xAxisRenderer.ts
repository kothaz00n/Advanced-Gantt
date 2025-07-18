import * as d3 from "d3";
import { esLocale } from "../utils/esLocale";

export interface AxisXFormatting {
    fontSize: number;
    fontColor: string;
    fontFamily: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
}

export function renderXAxis({
    svgTop,
    svgBottom,
    xScale,
    xStart,
    xEnd,
    format,
    formatting
}: {
    svgTop: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    svgBottom: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    xScale: d3.ScaleTime<number, number>;
    xStart: Date;
    xEnd: Date;
    format: string;
    formatting: AxisXFormatting;
}) {
    svgTop.selectAll("*").remove();
    svgBottom.selectAll("*").remove();

    let formatFuncAxis1: ((d: Date) => string) | null = null;
    let formatFuncAxis2: (d: Date) => string;
    let tickValuesAxis: Date[] | null = null;

    let intervals: Date[] = [];
    let nextInterval: (d: Date) => Date;
    let labelFormat: (d: Date) => string;

    switch (format) {
        case "Hora":
            formatFuncAxis1 = esLocale.format("%d %B");
            formatFuncAxis2 = d3.timeFormat("%H");
            tickValuesAxis = d3.timeDays(xStart, xEnd).map((d, i, arr) => {
                const next = arr[i + 1] || xEnd;
                return new Date((d.getTime() + next.getTime()) / 2);
            });
            intervals = d3.timeHours(xStart, xEnd);
            nextInterval = d => d3.timeHour.offset(d, 1);
            labelFormat = d3.timeFormat("%H");
            break;

        case "Día":
        case "Todo":
            formatFuncAxis1 = esLocale.format("%B %y");
            formatFuncAxis2 = d3.timeFormat("%d");
            tickValuesAxis = d3.timeMonths(xStart, xEnd).map((d, i, arr) => {
                const next = arr[i + 1] || xEnd;
                return new Date((d.getTime() + next.getTime()) / 2);
            });
            intervals = d3.timeDays(xStart, xEnd);
            nextInterval = d => d3.timeDay.offset(d, 1);
            labelFormat = d3.timeFormat("%d");
            break;

        case "Mes":
            formatFuncAxis1 = d3.timeFormat("%Y");
            formatFuncAxis2 = esLocale.format("%b");
            tickValuesAxis = d3.timeYears(xStart, xEnd).map((d, i, arr) => {
                const next = arr[i + 1] || xEnd;
                return new Date((d.getTime() + next.getTime()) / 2);
            });
            intervals = d3.timeMonths(xStart, xEnd);
            nextInterval = d => d3.timeMonth.offset(d, 1);
            labelFormat = esLocale.format("%b");
            break;

        case "Año":
            formatFuncAxis1 = null;
            formatFuncAxis2 = d3.timeFormat("%Y");
            tickValuesAxis = d3.timeYears(xStart, xEnd).map((d, i, arr) => {
                const next = arr[i + 1] || xEnd;
                return new Date((d.getTime() + next.getTime()) / 2);
            });
            intervals = d3.timeYears(xStart, xEnd);
            nextInterval = d => d3.timeYear.offset(d, 1);
            labelFormat = d3.timeFormat("%Y");
            break;

        default:
            formatFuncAxis1 = esLocale.format("%B %y");
            formatFuncAxis2 = d3.timeFormat("%d");
            tickValuesAxis = d3.timeMonths(xStart, xEnd).map((d, i, arr) => {
                const next = arr[i + 1] || xEnd;
                return new Date((d.getTime() + next.getTime()) / 2);
            });
            intervals = d3.timeDays(xStart, xEnd);
            nextInterval = d => d3.timeDay.offset(d, 1);
            labelFormat = d3.timeFormat("%d");
            break;
    }

    if (tickValuesAxis && formatFuncAxis1) {
        const xAxisTopG = svgTop.append("g")
            .attr("transform", `translate(0, 25)`)
            .call(d3.axisTop(xScale)
                .tickValues(tickValuesAxis)
                .tickFormat(formatFuncAxis1)
            );

        xAxisTopG.selectAll(".tick line").attr("display", "none");
        xAxisTopG.selectAll(".domain").attr("display", "none");
        xAxisTopG.selectAll("text")
            .attr("font-size", formatting.fontSize)
            .attr("font-family", formatting.fontFamily)
            .attr("fill", formatting.fontColor)
            .attr("font-weight", formatting.bold ? "bold" : "normal")
            .attr("font-style", formatting.italic ? "italic" : "normal")
            .attr("text-decoration", formatting.underline ? "underline" : "none");
    }

    // Asegurá incluir el último corte
    if (+intervals[intervals.length - 1] < +xEnd) {
        intervals.push(new Date(xEnd));
    }

    const xAxisBottomG = svgBottom.append("g").attr("class", "custom-x-axis");

    // Líneas
    xAxisBottomG.selectAll("line.x-tick")
        .data(intervals)
        .enter()
        .append("line")
        .attr("class", "x-tick")
        .attr("x1", d => xScale(d))
        .attr("x2", d => xScale(d))
        .attr("y1", 0)
        .attr("y2", 20)
        .attr("stroke", "#bbb")
        .attr("stroke-width", 1.5);

    xAxisBottomG.append("line")
        .attr("class", "x-domain")
        .attr("x1", xScale.range()[0])
        .attr("x2", xScale.range()[1])
        .attr("y1", 0)
        .attr("y2", 20)
        .attr("stroke", "#bbb")
        .attr("stroke-width", 2);

    // Etiquetas
    xAxisBottomG.selectAll("text.x-label")
        .data(intervals.slice(0, -1))
        .enter()
        .append("text")
        .attr("class", "x-label")
        .attr("x", (d, i) => {
            const next = intervals[i + 1];
            return (xScale(d) + xScale(next)) / 2;
        })
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "hanging")
        .attr("font-size", formatting.fontSize)
        .attr("font-family", formatting.fontFamily)
        .attr("fill", formatting.fontColor)
        .attr("font-weight", formatting.bold ? "bold" : "normal")
        .attr("font-style", formatting.italic ? "italic" : "normal")
        .attr("text-decoration", formatting.underline ? "underline" : "none")
        .text(labelFormat);

}
