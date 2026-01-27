import * as d3 from "d3";
import { BarDatum } from "../visual";
export declare function getGroupBarPath(scaleX: d3.ScaleTime<number, number>, scaleY: d3.ScaleBand<string>, d: BarDatum, taskHeight: number, barHeight: number): string;
