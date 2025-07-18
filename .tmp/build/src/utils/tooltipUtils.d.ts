import powerbi from "powerbi-visuals-api";
import ITooltipService = powerbi.extensibility.ITooltipService;
import { ITooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";
import { BarDatum } from "../visual";
type VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
/**
 * Inicializa y devuelve el wrapper de tooltips.
 */
export declare function initTooltipServiceWrapper(tooltipService: ITooltipService, rootElement: HTMLElement): ITooltipServiceWrapper;
/**
 * Genera el contenido del tooltip a partir de un BarDatum.
 */
export declare function getTooltipData(d: BarDatum): VisualTooltipDataItem[];
/**
 * Aplica tooltips a una selección de barras.
 */
export declare function applyTooltips(wrapper: ITooltipServiceWrapper, selection: d3.Selection<SVGRectElement, BarDatum, any, any>): void;
export {};
