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
    fontFamily?: string;
    fontSize?: number;
    fontColor?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
}
export declare function renderDurationLabels(opts: LabelOptions): void;
export {};
