import * as d3 from "d3";
export interface AxisXFormatting {
    fontSize: number;
    fontColor: string;
    fontFamily: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
}
export declare function renderXAxis({ svgTop, svgBottom, xScale, xStart, xEnd, format, formatting }: {
    svgTop: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    svgBottom: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    xScale: d3.ScaleTime<number, number>;
    xStart: Date;
    xEnd: Date;
    format: string;
    formatting: AxisXFormatting;
}): void;
