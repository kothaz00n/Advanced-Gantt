import * as d3 from "d3";
interface RenderLandingParams {
    svg: d3.Selection<SVGGElement, unknown, null, undefined>;
    width: number;
    height: number;
}
export declare function renderLanding({ svg, width, height }: RenderLandingParams): void;
export {};
