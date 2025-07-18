import * as d3 from "d3";
export interface BarCompletionData {
    taskName: string;
    start: Date;
    end: Date;
    completion: number;
    color: string;
}
export declare class BarCompletionRenderer {
    private group;
    private x;
    private y;
    private barHeight;
    constructor(group: d3.Selection<SVGGElement, unknown, null, undefined>, xScale: d3.ScaleTime<number, number>, yScale: d3.ScaleBand<string>, barHeight: number);
    render(data: BarCompletionData[]): void;
}
