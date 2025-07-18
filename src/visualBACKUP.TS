"use strict";

import "./../style/visual.less";
import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";
import { esLocale } from "./utils/esLocale"; // Formatting X Axis label
import { renderDurationLabels } from "./utils/renderLabels";
import { renderFormatButtons } from "./components/formatButtons";
import { renderParentToggleButtons } from "./components/parentButtons";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel/lib/FormattingSettingsService";
import { VisualFormattingSettingsModel } from "./settings";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { createTooltipServiceWrapper, ITooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";
import ypfBg from "../assets/ypf_background.svg";
import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils";

// powerbi.visuals
import IVisual = powerbi.extensibility.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import ISelectionID = powerbi.visuals.ISelectionId
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataView = powerbi.DataView;
import FormattingModel = powerbi.visuals.FormattingModel;
import VisualShortcutType = powerbi.visuals.VisualShortcutType;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import Fill = powerbi.Fill;
import FormattingId = powerbi.visuals.FormattingId;

// Interfaces
interface Task {
  id: string;
  parent: string | null;
  start: Date;
  end: Date;
  fields: string[];
}
interface VisualRow {
  id: string;
  isGroup: boolean;
  task?: Task;
  rowKey: string;
  labelY: string;
  duration?: number; // <-- añadida propiedad para duración de grupo
}

interface References {
  cardUid?: string;
  groupUid?: string;
  fill?: FormattingId;
}
export interface BarDatum {
  id: string;
  start: Date;
  end: Date;
  rowKey: string;
  isGroup: boolean;
  index: number;
}
const enum GanttObjectNames {
  ColorSelector = "colorSelector"
}

const colorSelectorReferences: References = {
  cardUid: "Visual-colorSelector-card",
  groupUid: "colorSelector-group",
  fill: {
    objectName: GanttObjectNames.ColorSelector,
    propertyName: "fill"
  }
};

export interface GanttDataPoint {
  task: string;
  parent: string;
  startDate: Date;
  endDate: Date;
  color: string;
  selectionId: ISelectionID;
  index: number;
}

// Funciones
function createSelectorDataPoints(options: VisualUpdateOptions, host: IVisualHost): GanttDataPoint[] {
  const dataPoints: GanttDataPoint[] = [];
  const dataViews = options.dataViews;

  if (!dataViews
    || !dataViews[0]
    || !dataViews[0].categorical
    || !dataViews[0].categorical.categories
    || !dataViews[0].categorical.categories[1]?.values
    || !dataViews[0].categorical.values
  ) {
    return dataPoints;
  }

  const categorical = dataViews[0].categorical;
  const parent = categorical.categories[1]; // Parent está en la posición 1

  const colorPalette: ISandboxExtendedColorPalette = host.colorPalette;

  // 🔁 Agrupamos por parent único
  const uniqueParents = [...new Set(parent.values.map(v => `${v}`))];

  uniqueParents.forEach((value, i) => {
    const index = parent.values.findIndex(v => `${v}` === value);
    const selectionId: ISelectionID = host.createSelectionIdBuilder()
      .withCategory(parent, index)
      .createSelectionId();

    const color = getColumnColorByIndex(parent, index, colorPalette);

    dataPoints.push({
      task: "",
      parent: value,
      startDate: new Date(),
      endDate: new Date(),
      color,
      selectionId,
      index
    });
  });

  return dataPoints;
}


function getColumnColorByIndex(
  category: DataViewCategoryColumn,
  index: number,
  colorPalette: ISandboxExtendedColorPalette,
): string {
  if (colorPalette.isHighContrast) {
    return colorPalette.background.value;
  }

  const defaultColor: Fill = {
    solid: {
      color: colorPalette.getColor(`${category.values[index]}`).value,
    }
  };

  const prop: DataViewObjectPropertyIdentifier = {
    objectName: "colorSelector",
    propertyName: "fill"
  };

  let colorFromObjects: Fill;
  if (category.objects?.[index]) {
    colorFromObjects = dataViewObjects.getValue(category?.objects[index], prop);
  }

  return colorFromObjects?.solid.color ?? defaultColor.solid.color;
}


// Clase Visual (Principal)
export class Visual implements IVisual {
  private container: HTMLElement;
  private yAxisDiv: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  private yAxisSVG: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private ganttDiv: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  private ganttSVG: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private leftBtns: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  private rightBtns: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  private leftG: d3.Selection<SVGGElement, unknown, null, undefined>;
  private ganttG: d3.Selection<SVGGElement, unknown, null, undefined>;
  private linesG: d3.Selection<SVGGElement, unknown, null, undefined>;
  private landingG: d3.Selection<SVGGElement, unknown, null, undefined>;
  private xAxisFixedG: d3.Selection<SVGGElement, unknown, null, undefined>;
  private xAxisFixedDiv: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  private xAxisFixedSVG: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private expanded = new Map<string, boolean>();
  private cacheTasks: Task[] = [];
  private groupRange = new Map<string, { start: Date; end: Date }>();
  private selectedFormat: string = "Todo";
  private lastOptions: VisualUpdateOptions;
  private taskColCount = 0;
  private taskColNames: string[] = [];
  private fmtService = new FormattingSettingsService();
  private fmtSettings = new VisualFormattingSettingsModel();
  private tooltipServiceWrapper: ITooltipServiceWrapper;
  private allExpanded = true;
  private host: IVisualHost;
  private ganttdataPoints: GanttDataPoint[]

  constructor(opts: VisualConstructorOptions) {
    this.container = opts.element as HTMLElement;
    this.host = opts.host

    this.tooltipServiceWrapper = createTooltipServiceWrapper(
      opts.host.tooltipService,
      opts.element
    );

    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }

    const topBtnsWrapper = d3.select(this.container)
      .append("div")
      .attr("class", "top-btns-wrapper")
      .style("display", "flex")
      .style("justify-content", "space-between")
      .style("gap", "8px")
      .style("align-items", "center");

    this.leftBtns = topBtnsWrapper.append("div").attr("class", "parent-btn-container");
    this.rightBtns = topBtnsWrapper.append("div").attr("class", "format-btn-container");

    const onChangeHandler = (expand: boolean) => {
      this.allExpanded = expand;
      for (const key of this.expanded.keys()) {
        this.expanded.set(key, expand);
      }
      renderParentToggleButtons({
        container: this.leftBtns.node() as HTMLElement,
        allExpanded: this.allExpanded,
        onChange: onChangeHandler
      });
      this.update(this.lastOptions);
    };

    renderParentToggleButtons({
      container: this.leftBtns.node() as HTMLElement,
      allExpanded: this.allExpanded,
      onChange: onChangeHandler
    });

    renderFormatButtons({
      container: this.rightBtns.node() as HTMLElement,
      selectedFormat: this.selectedFormat,
      onFormatChange: (fmt: string) => {
        this.selectedFormat = fmt;
        this.update(this.lastOptions);
      }
    });

    const layoutDiv = d3.select(this.container)
      .append("div")
      .attr("class", "layout-wrapper")
      .style("display", "flex")
      .style("height", "100%")
      .style("width", "100%");

    this.yAxisDiv = layoutDiv.append("div")
      .attr("class", "y-axis-fixed")
      .style("flex", "none")
      .style("z-index", "2")
      .style("overflow", "hidden")
      .style("background", "#fff");

    this.yAxisSVG = this.yAxisDiv.append("svg");

    this.ganttDiv = layoutDiv.append("div")
      .attr("class", "scroll-wrapper")
      .style("flex", "1 1 0")
      .style("overflow-x", "auto")
      .style("overflow-y", "auto")
      .style("width", "100%")
      .style("height", "100%")
      .style("position", "relative");

    this.ganttSVG = this.ganttDiv.append("svg")
      .attr("height", "100%")
      .style("display", "block");

    this.xAxisFixedDiv = d3.select(this.container)
      .append("div")
      .attr("class", "x-axis-fixed")
      .style("position", "absolute")
      .style("top", "60px")
      .style("left", `0px`)
      .style("right", "0px")
      .style("height", "60px")
      .style("overflow", "hidden")
      .style("z-index", "0")
      .style("background", "#fff")
      .style("display", "none");

    this.xAxisFixedSVG = this.xAxisFixedDiv.append("svg")
      .style("width", "100%")
      .style("height", "60px");

    this.xAxisFixedG = this.xAxisFixedSVG.append("g");
    this.ganttDiv.on("scroll", () => {
      const scrollNode = this.ganttDiv.node()!;
      const scrollLeft = scrollNode.scrollLeft;
      const scrollTop = scrollNode.scrollTop;
      this.xAxisFixedG.attr("transform", `translate(${-scrollLeft},0)`);
      this.leftG.select<SVGGElement>(".y-content")
        .attr("transform", `translate(0, ${60 - scrollTop})`);
    });

    this.leftG = this.yAxisSVG.append("g");
    this.ganttG = this.ganttSVG.append("g");
    this.linesG = this.ganttG.append("g").attr("class", "y-grid");
    this.landingG = this.ganttSVG.append("g")
      .attr("class", "landing")
      .style("pointer-events", "none");

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;
    this.ganttDiv
      .on("mousedown", (event: MouseEvent) => {
        isDragging = true;
        startX = event.pageX - this.ganttDiv.node()!.offsetLeft;
        startY = event.pageY - this.ganttDiv.node()!.offsetTop;
        scrollLeft = this.ganttDiv.node()!.scrollLeft;
        scrollTop = this.ganttDiv.node()!.scrollTop;
        this.ganttDiv.style("cursor", "grabbing");
        event.preventDefault();
      })
      .on("mouseleave", () => {
        isDragging = false;
        this.ganttDiv.style("cursor", "default");
      })
      .on("mouseup", () => {
        isDragging = false;
        this.ganttDiv.style("cursor", "default");
      })
      .on("mousemove", (event: MouseEvent) => {
        if (!isDragging) return;
        const x = event.pageX - this.ganttDiv.node()!.offsetLeft;
        const y = event.pageY - this.ganttDiv.node()!.offsetTop;
        const walkX = x - startX;
        const walkY = y - startY;
        this.ganttDiv.node()!.scrollLeft = scrollLeft - walkX;
        this.ganttDiv.node()!.scrollTop = scrollTop - walkY;
      });
  }

  public update(opts: VisualUpdateOptions): void {

    // COLOR PARA BARRAS: 
    this.fmtSettings = this.fmtService.populateFormattingSettingsModel(VisualFormattingSettingsModel, opts.dataViews?.[0]);
    this.ganttdataPoints = createSelectorDataPoints(opts, this.host)
    this.fmtSettings.populateColorSelector(this.ganttdataPoints);
    // FIN COLOR PARA BARRA
    const { width, height } = opts.viewport;
    this.lastOptions = opts;

    const dv: DataView | undefined = opts.dataViews?.[0];
    const hasData = Boolean(dv?.categorical?.categories?.length) &&
      (dv?.categorical?.values?.length ?? 0) >= 2;

    this.leftBtns.style("display", hasData ? "block" : "none");
    this.rightBtns.style("display", hasData ? "block" : "none");

    const baseCols = 2;
    const visibleFieldsCount = this.taskColCount;
    const hasD = this.cacheTasks.some(t => t.fields.length > this.taskColCount);
    const totalCols = baseCols + visibleFieldsCount + (hasD ? 1 : 0);

    const colW = 180, pad = 10;
    const durColWidth = 100;
    const colWidths = Array(totalCols).fill(colW);
    if (hasD) {
      colWidths[totalCols - 1] = durColWidth;
    }

    const margin = {
      top: 60,
      right: 20,
      bottom: 60,
      left: pad + colWidths.reduce((acc, w) => acc + w, 0)
    };

    this.yAxisSVG.selectAll("*").remove();
    this.ganttSVG.selectAll("*").remove();
    this.xAxisFixedG.selectAll("*").remove();

    if (!hasData) {
      this.landingG = this.ganttSVG.append("g")
        .attr("class", "landing")
        .style("pointer-events", "none");
      this.ganttSVG
        .attr("width", width)
        .attr("height", height);
      this.yAxisSVG.attr("display", "none")
        .attr("width", margin.left)
        .attr("height", height);
      this.xAxisFixedDiv.style("display", "none");
      this.xAxisFixedSVG.style("display", "none");
      this.xAxisFixedG.style("display", "none");
      this.renderLanding(width, height);
      return;
    }
    this.xAxisFixedDiv.style("display", null);
    this.xAxisFixedSVG.style("display", null);
    this.xAxisFixedG.style("display", null);
    this.yAxisSVG.attr("display", null);
    this.landingG.attr("display", "none");

    const expCache = new Map(this.expanded);

    const tasks = this.parseData(dv);
    if (tasks.length) this.cacheTasks = tasks;
    const { visibleRows, expanded } = this.buildRows(this.cacheTasks, expCache);
    this.expanded = expanded;

    const rowH = this.fmtSettings.taskCard.taskHeight.value;
    const innerH = rowH * visibleRows.length;

    let xStart = d3.min(this.cacheTasks, d => d.start)!;
    let xEnd = d3.max(this.cacheTasks, d => d.end)!;
    if (xStart >= xEnd) xEnd = new Date(xStart.getTime() + 3_600_000);
    switch (this.selectedFormat) {
      case "Año":
        xStart = d3.timeYear.floor(xStart);
        xEnd = d3.timeYear.offset(xEnd, 1);
        break;
      case "Mes":
        xStart = d3.timeMonth.floor(xStart);
        xEnd = d3.timeMonth.offset(xEnd, 1);
        break;
      case "Día":
        xStart = d3.timeDay.floor(xStart);
        xEnd = d3.timeDay.offset(xEnd, 1);
        break;
      case "Hora":
        xStart = d3.timeHour.floor(xStart);
        xEnd = d3.timeHour.offset(xEnd, 1);
        break;
      default:
        xStart = d3.timeDay.floor(xStart);
        xEnd = d3.timeDay.offset(xEnd, 1);
        break;
    }
    let innerW = 0;

    if (this.selectedFormat === "Hora") {
      const numHours = d3.timeHour.count(xStart, xEnd);
      const minHoursWidth = 38
      innerW = Math.max(numHours * minHoursWidth, width - margin.left - margin.right);
    }
    else if (this.selectedFormat === "Mes") {
      const numMonths = d3.timeMonth.count(xStart, xEnd);
      const minMonthWidth = 90;
      innerW = Math.max(numMonths * minMonthWidth, width - margin.left - margin.right);
    } else if (this.selectedFormat === "Día") {
      const numDays = d3.timeDay.count(xStart, xEnd);
      const minDayWidth = 38;
      innerW = Math.max(numDays * minDayWidth, width - margin.left - margin.right);
    }
    else if (this.selectedFormat === "Año") {
      const numYear = d3.timeYear.count(xStart, xEnd) <= 2 ? d3.timeMonth.count(xStart, xEnd) : d3.timeYear.count(xStart, xEnd);
      const minYearWidth = 15
      innerW = Math.max(numYear * minYearWidth, width - margin.left - margin.right);
    }
    else if (this.selectedFormat === "Todo") {
      const numDays = d3.timeDay.count(xStart, xEnd);
      const minYearWidth = 38
      innerW = Math.max(numDays * minYearWidth, width - margin.left - margin.right);
    };

    this.yAxisSVG
      .attr("width", margin.left)
      .attr("height", innerH + margin.top + margin.bottom);
    this.ganttSVG
      .attr("width", innerW + margin.right)
      .attr("height", innerH + margin.top + margin.bottom);

    this.xAxisFixedSVG
      .attr("width", innerW + margin.right)
      .attr("height", 60);
    const x = d3.scaleTime().domain([xStart, xEnd]).range([0, innerW]);
    const y = d3.scaleBand()
      .domain(visibleRows.map(r => r.rowKey))
      .range([0, innerH])
      .paddingInner(0)
      .paddingOuter(0);
    const colX = (i: number) => pad + colWidths.slice(0, i).reduce((acc, w) => acc + w, 0);
    const headFmt = this.fmtSettings.headerCard;
    const taskFmt = this.fmtSettings.taskCard;
    const parFmt = this.fmtSettings.parentCard;

    this.leftG = this.yAxisSVG.append("g").attr("class", "left-g");
    const yAxisContentG = this.leftG.append("g")
      .attr("class", "y-content")
      .attr("transform", `translate(0, ${margin.top})`);
    const gridYPos = visibleRows.map(r => y(r.rowKey)!);

    const header = yAxisContentG.append("g")
      .attr("class", "y-grid")
      .selectAll("line")
      .data(gridYPos)
      .join("line")
      .attr("x1", 0)
      .attr("x2", margin.left)
      .attr("y1", d => d)
      .attr("y2", d => d)
      .attr("stroke", this.fmtSettings.axisYCard.lineColor.value.value)
      .attr("stroke-width", 1);

    if (headFmt.show.value) {
      const head = this.leftG.append("g")
        .attr("class", "header")
        .attr("transform", `translate(0, ${margin.top})`);
      head.append("rect")
        .attr("x", 0)
        .attr("y", -90)
        .attr("width", margin.left)
        .attr("height", 90)
        .attr("zindex", 999)
        .attr("fill", this.fmtSettings.headerCard.backgroundColor.value.value);
      head.append("line")
        .attr("x1", 0)
        .attr("x2", margin.left)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", this.fmtSettings.axisYCard.lineColor.value.value)
        .attr("stroke-width", this.fmtSettings.axisYCard.widthLine.value);

      this.taskColNames.forEach((n, i) =>
        head.append("text").text(n)
          .attr("x", colX(i))
          .attr("y", -10)
          .attr("zindex", 999)
          .attr("fill", headFmt.fontColor.value.value)
          .attr("font-size", headFmt.fontSize.value)
          .attr("font-family", headFmt.fontFamily.value)
      );
      head.append("text").text("Inicio")
        .attr("x", colX(this.taskColCount))
        .attr("y", -10)
        .attr("zindex", 999)
        .attr("fill", headFmt.fontColor.value.value)
        .attr("font-size", headFmt.fontSize.value)
        .attr("font-family", headFmt.fontFamily.value);
      head.append("text").text("Fin")
        .attr("x", colX(this.taskColCount + 1))
        .attr("y", -10)
        .attr("zindex", 999)
        .attr("fill", headFmt.fontColor.value.value)
        .attr("font-size", headFmt.fontSize.value)
        .attr("font-family", headFmt.fontFamily.value);
      if (hasD) {
        head.append("text").text("Duración")
          .attr("x", colX(this.taskColCount + 2))
          .attr("y", -10)
          .attr("zindex", 999)
          .attr("fill", headFmt.fontColor.value.value)
          .attr("font-size", headFmt.fontSize.value)
          .attr("font-family", headFmt.fontFamily.value);
      }
    }
    const dateFmt = d3.timeFormat("%d/%m/%Y %H:%M:%S");
    const self = this;

    const yAxis = yAxisContentG.selectAll(".row")
      .data(visibleRows)
      .enter().append("g")
      .attr("class", "row")
      .each(function (row) {
        const top = y(row.rowKey);
        if (top === undefined) return;
        const g = d3.select(this);
        if (row.isGroup) {
          g.append("rect")
            .attr("x", 0)
            .attr("y", top)
            .attr("width", margin.left)
            .attr("height", y.bandwidth())
            .attr("fill", parFmt.backgroundColor.value.value);
          const exp = self.expanded.get(row.id) ?? true;
          g.append("text")
            .text(exp ? "▼ " + row.labelY : "▶ " + row.labelY)
            .attr("x", 5)
            .attr("y", top + y.bandwidth() / 2 + 4)
            .attr("font-weight", "bold")
            .attr("cursor", "pointer")
            .attr("font-family", parFmt.fontFamily.value)
            .attr("font-size", parFmt.fontSize.value)
            .attr("fill", parFmt.fontColor.value.value)
            .on("click", () => {
              self.expanded.set(row.id, !exp);
              const expandedValues = Array.from(self.expanded.values());
              self.allExpanded = expandedValues.every(Boolean);
              self.update(self.lastOptions);
            });

          const r = self.groupRange.get(row.id);
          if (r) {
            g.append("text").text(dateFmt(r.start))
              .attr("x", colX(self.taskColCount))
              .attr("y", top + y.bandwidth() / 2 + 4)
              .attr("font-weight", "bold")
              .attr("fill", parFmt.fontColor.value.value)
              .attr("font-size", parFmt.fontSize.value)
              .attr("font-family", parFmt.fontFamily.value);
            g.append("text").text(dateFmt(r.end))
              .attr("x", colX(self.taskColCount + 1))
              .attr("y", top + y.bandwidth() / 2 + 4)
              .attr("font-weight", "bold")
              .attr("fill", parFmt.fontColor.value.value)
              .attr("font-size", parFmt.fontSize.value)
              .attr("font-family", parFmt.fontFamily.value);
          }
          if (row.duration !== undefined && hasD) {
            g.append("text").text(String(row.duration))
              .attr("x", colX(self.taskColCount + 2))
              .attr("y", top + y.bandwidth() / 2 + 4)
              .attr("font-weight", "bold")
              .attr("fill", parFmt.fontColor.value.value)
              .attr("font-size", parFmt.fontSize.value)
              .attr("font-family", parFmt.fontFamily.value);
          }

        } else if (row.task) {
          const hasDuration = row.task.fields.length > self.taskColCount;
          const durationIndex = hasDuration ? row.task.fields.length - 1 : -1;

          row.task.fields.forEach((val, i) => {
            if (hasDuration && i === durationIndex) return;
            g.append("text").text(val)
              .attr("x", colX(i))
              .attr("y", top + y.bandwidth() / 2 + 4)
              .attr("font-size", taskFmt.fontSize.value)
              .attr("fill", taskFmt.fontColor.value.value)
              .attr("font-family", taskFmt.fontFamily.value);
          });

          g.append("text").text(dateFmt(row.task.start))
            .attr("x", colX(self.taskColCount))
            .attr("y", top + y.bandwidth() / 2 + 4)
            .attr("font-size", taskFmt.fontSize.value)
            .attr("fill", taskFmt.fontColor.value.value ?? taskFmt.fontColor.value.value)
            .attr("font-family", taskFmt.fontFamily.value);

          g.append("text").text(dateFmt(row.task.end))
            .attr("x", colX(self.taskColCount + 1))
            .attr("y", top + y.bandwidth() / 2 + 4)
            .attr("font-size", taskFmt.fontSize.value)
            .attr("fill", taskFmt.fontColor.value.value ?? taskFmt.fontColor.value.value)
            .attr("font-family", taskFmt.fontFamily.value);

          if (hasDuration) {
            const durationVal = row.task.fields[durationIndex];
            g.append("text").text(durationVal)
              .attr("x", colX(self.taskColCount + 2))
              .attr("y", top + y.bandwidth() / 2 + 4)
              .attr("font-size", taskFmt.fontSize.value)
              .attr("fill", taskFmt.fontColor.value.value ?? taskFmt.fontColor.value.value)
              .attr("font-family", taskFmt.fontFamily.value);
          }
        }
      });
    this.leftG.selectAll(".row")
      .data(visibleRows)
      .enter().append("g")
      .attr("class", "row")
      .each(function (row) {
        // ...
      });
    yAxisContentG.append("line")
      .attr("x1", margin.left - 1)
      .attr("x2", margin.left - 1)
      .attr("y1", 0)
      .attr("y2", innerH)
      .attr("stroke", this.fmtSettings.axisYCard.lineColor.value.value)
      .attr("stroke-width", this.fmtSettings.axisYCard.widthLine.value)

    yAxisContentG.selectAll(".y-tick")
      .data(visibleRows)
      .enter()
      .append("line")
      .attr("class", "y-tick")
      .attr("x1", margin.left - 7)
      .attr("x2", margin.left - 1)
      .attr("y1", (d) => y(d.rowKey)! + y.bandwidth() / 2)
      .attr("y2", (d) => y(d.rowKey)! + y.bandwidth() / 2)
      .attr("stroke", "#bbbbbb")
      .attr("stroke-width", 2);
    this.ganttG = this.ganttSVG.append("g").attr("transform", `translate(0, ${margin.top})`);

    const backgroundG = this.ganttG.append("g").attr("class", "background-grid");
    if (this.selectedFormat === "Mes") {
      const months = d3.timeMonths(xStart, xEnd);
      backgroundG.selectAll("line.month")
        .data(months)
        .enter()
        .append("line")
        .attr("x1", d => x(d))
        .attr("x2", d => x(d))
        .attr("y1", 0)
        .attr("y2", innerH)
        .attr("stroke", "#cccccc")
        .attr("stroke-width", 1)
        .attr("class", "month");
    }
    if (this.selectedFormat === "Hora") {
      const dias = d3.timeDays(xStart, xEnd);
      backgroundG.selectAll("line.day")
        .data(dias)
        .enter()
        .append("line")
        .attr("x1", d => x(d))
        .attr("x2", d => x(d))
        .attr("y1", 0)
        .attr("y2", innerH)
        .attr("stroke", "#eeeeee")
        .attr("stroke-width", 1)
        .attr("class", "day");
    }
    if (this.selectedFormat === "Día" || this.selectedFormat === "Todo") {
      const dias = d3.timeDays(xStart, xEnd);
      backgroundG.selectAll("rect.weekend")
        .data(dias.filter(d => d.getDay() === 6)) // solo sábados
        .enter()
        .append("rect")
        .attr("x", d => x(d))
        .attr("y", -3)
        .attr("y2", margin.bottom)
        .attr("width", d => x(d3.timeDay.offset(d, 2)) - x(d))
        .attr("height", innerH + 3)
        .attr("fill", "#eeeeee")
        .attr("class", "weekend");
    }

    const barCfg = this.fmtSettings.barCard;
    const barColor = (this.fmtSettings.barCard.barGroup.slices.find(s => s.name === "fill") as formattingSettings.ColorPicker)?.value.value ?? "#000000";
    const barH = Math.min((this.fmtSettings.barCard.barGroup.slices.find(s => s.name === "barHeight") as formattingSettings.NumUpDown)?.value ?? 30, rowH);
    const yOff = (taskFmt.taskHeight.value - barH) / 2;

    const taskBars: BarDatum[] = visibleRows
      .filter(r => !r.isGroup && r.task)
      .map((r, i) => ({
        id: r.task!.id,
        start: r.task!.start,
        end: r.task!.end,
        rowKey: r.rowKey,
        isGroup: false,
        index: i
      }));

    const groupBars: BarDatum[] = visibleRows
      .filter(r => r.isGroup)
      .map((r, i) => {
        const { start, end } = this.groupRange.get(r.id)!;
        return { id: r.id, start, end, rowKey: r.rowKey, isGroup: true, index: i };
      });

    const allBars = [...taskBars, ...groupBars];

    if (allBars.length) {
      const bars = this.ganttG.selectAll<SVGElement, BarDatum>(".bar").attr("fill", d => {
        const dp = this.ganttdataPoints.find(p => p.parent === d.rowKey.split("|")[0]);
        return dp?.color ?? "#000";
      })
        .data(allBars, d => d.id)
        .join(
          enter => enter.append(d =>
            document.createElementNS("http://www.w3.org/2000/svg", d.isGroup ? "path" : "rect")
          ).attr("class", "bar"),
          update => update,
          exit => exit.remove()
        );
      bars.filter(d => !d.isGroup)
        .attr("x", d => x(d.start))
        .attr("y", d => y(d.rowKey)! + yOff)
        .attr("width", d => x(d.end) - x(d.start))
        .attr("height", barH)
        .attr("fill", d => {
          const key = d.rowKey.split("|")[1]; // REVISAR CODIGO ACÁ
          const dp = this.ganttdataPoints.find(p => p.parent === key);
          if (!dp) console.warn("No match for bar:", key);
          return dp?.color ?? "#72c0ffff";
        })
        .text("text")
        .attr("rx", (barCfg.barGroup.slices.find(s => s.name === "cornerRadius") as formattingSettings.Slider).value)
        .attr("ry", (barCfg.barGroup.slices.find(s => s.name === "cornerRadius") as formattingSettings.Slider).value)
        .attr("stroke", (barCfg.barGroup.slices.find(s => s.name === "strokeColor") as formattingSettings.ColorPicker).value.value)
        .attr("stroke-width", (barCfg.barGroup.slices.find(s => s.name === "strokeWidth") as formattingSettings.Slider).value);

      bars.filter(d => d.isGroup)
        .attr("d", d => {
          const x1 = x(d.start);
          const x2 = x(d.end);
          const width = x2 - x1;

          const yTop = y(d.rowKey)! + (taskFmt.taskHeight.value - barH) / 2;
          const topHeight = barH * 0.5; // Altura de la franja superior
          const tipHeight = barH * 0.6; // Altura del triángulo hacia abajo
          const tipInset = Math.min(width * 0.15, 35); // distancia del triángulo hacia adentro

          const yBottom = yTop + topHeight + tipHeight;

          return `
      M${x1},${yTop}
      H${x2}
      L${x2},${yTop + topHeight + tipHeight}
      L${x2 - tipInset},${yTop + topHeight}
      H${x1 + tipInset}
      L${x1},${yTop + topHeight + tipHeight}
      Z
    `;
        })
        .attr("fill", d => {
          const key = d.rowKey.split("|")[0].replace(/^[A-Z]:/, ""); // REVISAR CODIGO ACÁ
          const dp = this.ganttdataPoints.find(p => p.parent === key);
          if (!dp) console.warn("No match for bar:", key);
          return dp?.color ?? "#72c0ffff";
        })
        .attr("stroke", d => {
          const key = d.rowKey.split("|")[0].replace(/^[A-Z]:/, ""); // REVISAR CODIGO ACÁ
          const dp = this.ganttdataPoints.find(p => p.parent === key);
          if (!dp) console.warn("No match for bar:", key);
          return dp?.color ?? "#72c0ffff";
        })
        .attr("stroke-width", 1);

      renderDurationLabels({
        svg: this.ganttG,
        bars: allBars, // o: allBars.filter(d => !d.isGroup)
        x,
        y,
        yOffset: yOff,
        barHeight: barH,
        fontFamily: (barCfg.labelGroup.slices.find(s => s.name === "labelFontFamily") as formattingSettings.FontPicker).value,
        fontSize: (barCfg.labelGroup.slices.find(s => s.name === "labelFontSize") as formattingSettings.NumUpDown).value,
        fontColor: (barCfg.labelGroup.slices.find(s => s.name === "labelFontColor") as formattingSettings.ColorPicker).value.value,
        bold: (barCfg.labelGroup.slices.find(s => s.name === "labelBold") as formattingSettings.ToggleSwitch).value,
        italic: (barCfg.labelGroup.slices.find(s => s.name === "labelItalic") as formattingSettings.ToggleSwitch).value,
        underline: (barCfg.labelGroup.slices.find(s => s.name === "labelUnderline") as formattingSettings.ToggleSwitch).value
      });
      const tooltipValues = dv.categorical.values.filter(val => val.source.roles && val.source.roles['tooltips']);

      this.tooltipServiceWrapper.addTooltip(
        bars,
        (d: BarDatum) => {
          const tooltipItems = [
            { displayName: "Parent",value: d.rowKey.split("|")[0].replace(/^G:/, "")},
            { displayName: "Task", value: d.id },
            { displayName: "Inicio", value: d.start.toLocaleString() },
            { displayName: "Fin", value: d.end.toLocaleString() }
          ];
          tooltipValues.forEach(val => {
            const v = val.values[d.index];
            tooltipItems.push({
              displayName: val.source.displayName,
              value: (v !== undefined && v !== null) ? String(v) : ""
            });
          });
          return tooltipItems;
        }
      );
    }

    let formatFuncAxis1: ((d: Date) => string) | null = null;
    let formatFuncAxis2: (d: Date) => string;
    let tickIntervalAxis1: any = null
    let tickIntervalAxis2: any = null
    let tickValuesAxis: Date[] | null = null;

    switch (this.selectedFormat) {
      case "Hora":
        formatFuncAxis1 = esLocale.format("%d %B")
        formatFuncAxis2 = d3.timeFormat("%H");
        tickIntervalAxis1 = null;
        tickIntervalAxis2 = d3.timeHour.every(1);
        {
          const days = d3.timeDays(x.domain()[0], x.domain()[1]);
          tickValuesAxis = days.map((d, i) => {
            const start = d;
            const end = days[i + 1] || x.domain()[1];
            return new Date((start.getTime() + end.getTime()) / 2);
          });
        }
        break;

      case "Día":
        formatFuncAxis1 = esLocale.format("%B %y");
        formatFuncAxis2 = d3.timeFormat("%d");
        tickIntervalAxis1 = null; 
        tickIntervalAxis2 = d3.timeDay.every(1);
        {
          const months = d3.timeMonths(x.domain()[0], x.domain()[1]);
          tickValuesAxis = months.map((d, i) => {
            const start = d;
            const end = months[i + 1] || x.domain()[1];
            return new Date((start.getTime() + end.getTime()) / 2);
          });
        }
        break;

      case "Mes":
        formatFuncAxis1 = d3.timeFormat("%Y");
        formatFuncAxis2 = esLocale.format("%b");
        tickIntervalAxis1 = null;
        tickIntervalAxis2 = d3.timeMonth.every(1);
        {
          const years = d3.timeYears(x.domain()[0], x.domain()[1]);
          tickValuesAxis = years.map((d, i) => {
            const start = d;
            const end = years[i + 1] || x.domain()[1];
            return new Date((start.getTime() + end.getTime()) / 2);
          });
        }
        break;
      case "Año":
        formatFuncAxis1 = null;
        formatFuncAxis2 = d3.timeFormat("%Y");
        tickIntervalAxis1 = null;
        tickIntervalAxis2 = d3.timeYear.every(1);
        tickValuesAxis = null;
        {
          const years = d3.timeYears(x.domain()[0], x.domain()[1]);
          tickValuesAxis = years.map((d, i) => {
            const start = d;
            const end = years[i + 1] || x.domain()[1];
            return new Date((start.getTime() + end.getTime()) / 1.5);
          });
        }
        break;
      case "Todo":
        formatFuncAxis1 = esLocale.format("%B %y");
        formatFuncAxis2 = d3.timeFormat("%d");
        tickIntervalAxis1 = null; 
        tickIntervalAxis2 = d3.timeDay.every(1);
        {
          const months = d3.timeMonths(x.domain()[0], x.domain()[1]);
          tickValuesAxis = months.map((d, i) => {
            const start = d;
            const end = months[i + 1] || x.domain()[1];
            return new Date((start.getTime() + end.getTime()) / 2);
          });
        }
        break;
    }

    const ax = this.fmtSettings.axisXCard;
    if (formatFuncAxis1 && tickValuesAxis) {
      const xAxis2 = this.xAxisFixedG.append("g")
        .attr("transform", `translate(${margin.left}, 25)`)
        .call(
          d3.axisTop(x)
            .tickValues(tickValuesAxis)
            .tickFormat(formatFuncAxis1)
        )
      xAxis2.selectAll(".tick line").attr("display", "none");
      xAxis2.selectAll(".domain").attr("display", "none");
      xAxis2.selectAll("text")
        .attr("font-size", ax.fontSize.value)
        .attr("font-family", ax.fontFamily.value)
        .attr("fill", ax.fontColor.value.value)
        .attr("font-weight", ax.bold.value ? "bold" : "normal")
        .attr("font-style", ax.italic.value ? "italic" : "normal")
        .attr("text-decoration", ax.underline.value ? "underline" : "none");
    }

    const axisBottomG = this.xAxisFixedG.append("g")
      .attr("class", "custom-x-axis")
      .attr("transform", `translate(${margin.left}, 58)`);
    let intervals: Date[];
    let nextInterval: (d: Date) => Date;
    let labelFormat: (d: Date) => string;

    switch (this.selectedFormat) {
      case "Hora":
        intervals = d3.timeHours(xStart, xEnd);
        nextInterval = (d) => d3.timeHour.offset(d, 1);
        labelFormat = d3.timeFormat("%H");
        break;
      case "Día":
      case "Todo":
        intervals = d3.timeDays(xStart, xEnd);
        nextInterval = (d) => d3.timeDay.offset(d, 1);
        labelFormat = d3.timeFormat("%d");
        break;
      case "Mes":
        intervals = d3.timeMonths(xStart, xEnd);
        nextInterval = (d) => d3.timeMonth.offset(d, 1);
        labelFormat = esLocale.format("%b");
        break;
      case "Año":
        intervals = d3.timeYears(xStart, xEnd);
        nextInterval = (d) => d3.timeYear.offset(d, 1);
        labelFormat = d3.timeFormat("%Y");
        break;
      default:
        intervals = d3.timeDays(xStart, xEnd);
        nextInterval = (d) => d3.timeDay.offset(d, 1);
        labelFormat = d3.timeFormat("%d");
        break;
    }
    if (+intervals[intervals.length - 1] < +xEnd) {
      intervals.push(new Date(xEnd));
    }
    const labelData = intervals.slice(0, -1);
    if (this.selectedFormat === "Día" || this.selectedFormat === "Todo") {
      axisBottomG.selectAll("rect.x-label-bg")
        .data(labelData)
        .enter()
        .append("rect")
        .attr("class", "x-label-bg")
        .attr("x", (d, i) => x(d))
        .attr("y", -30)
        .attr("width", (d, i) => x(intervals[i + 1]) - x(d) + 1)
        .attr("height", 30)
        .attr("stroke", "none")
        .attr("zindex", 1)
        .attr("fill", d => (d.getDay() === 0 || d.getDay() === 6) ? "#eeeeee" : "none");
    }

    axisBottomG.selectAll("line.x-tick")
      .data(intervals)
      .enter()
      .append("line")
      .attr("class", "x-tick")
      .attr("x1", d => x(d))
      .attr("x2", d => x(d))
      .attr("y1", -20)
      .attr("y2", 0)
      .attr("stroke", "#bbb")
      .attr("stroke-width", 1.5);

    axisBottomG.append("line")
      .attr("class", "x-domain")
      .attr("x1", x.range()[0])
      .attr("x2", x.range()[1])
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke", "#bbb")
      .attr("zindex", "15000")
      .attr("stroke-width", 2);
    axisBottomG.selectAll("text.x-label")
      .data(labelData)
      .enter()
      .append("text")
      .attr("class", "x-label")
      .attr("x", (d, i) => (x(d) + x(intervals[i + 1])) / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "hanging")
      .attr("font-size", ax.fontSize.value)
      .attr("font-family", ax.fontFamily.value)
      .attr("fill", ax.fontColor.value.value)
      .attr("font-weight", ax.bold.value ? "bold" : "normal")
      .attr("font-style", ax.italic.value ? "italic" : "normal")
      .attr("text-decoration", ax.underline.value ? "underline" : "none")
      .text(labelFormat);
  }

  private renderLanding(width: number, height: number) {
    this.landingG.attr("display", null).selectAll("*").remove();
    this.landingG.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#F3F3F3");

    const img = 180;
    this.landingG.append("image")
      .attr("href", ypfBg)
      .attr("xlink:href", ypfBg)
      .attr("width", img)
      .attr("height", img)
      .attr("x", width / 2 - img / 2)
      .attr("y", height / 2 - img / 2 - 30)
      .attr("preserveAspectRatio", "xMidYMid meet");

    this.landingG.append("text")
      .text("Dev by Nico Pastorini with ❤️ for YPF")
      .attr("x", width / 2)
      .attr("y", height / 2 + img / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "hanging")
      .attr("fill", "#666")
      .attr("font-size", 18)
      .attr("font-family", "Segoe UI")
      .attr("font-weight", "bold");
  }

  public getFormattingModel(): powerbi.visuals.FormattingModel {
    return this.fmtService.buildFormattingModel(this.fmtSettings);
  }

  private parseData(dv: DataView): Task[] {
    if (!dv.categorical?.categories?.length) return [];
    const cat = dv.categorical;
    const sVal = cat.values.find(v => v.source.roles && v.source.roles['startDate'])?.values;
    const eVal = cat.values.find(v => v.source.roles && v.source.roles['endDate'])?.values;

    const durVal = cat.values.find(v => v.source.roles && v.source.roles['duration'])?.values;

    const taskCols: { name: string; values: any[] }[] = [];
    const parentCols: { values: any[] }[] = [];

    cat.categories.forEach(c => {
      const r = c.source.roles;
      if (r?.task) taskCols.push({ name: c.source.displayName, values: c.values });
      if (r?.parent) parentCols.push({ values: c.values });
    });

    this.taskColCount = taskCols.length;
    this.taskColNames = taskCols.map(c => c.name);

    const out: Task[] = [];
    for (let i = 0; i < sVal.length; i++) {
      const taskFields = taskCols.map(c => String(c.values[i] ?? ""));
      const parentTxt = parentCols.map(c => String(c.values[i] ?? "")).join(" | ") || "Sin grupo";
      const start = new Date(sVal[i] as string);
      const end = new Date(eVal[i] as string);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

      const duration = durVal ? Number(durVal[i]) : undefined;
      const fieldsWithDuration = durVal ? [...taskFields, duration.toString()] : taskFields;
      out.push({ id: taskFields.join(" | "), parent: parentTxt, start, end, fields: fieldsWithDuration });
    }
    return out;
  }
  private buildRows(tasks: Task[], cache: Map<string, boolean>) {
    const rows: VisualRow[] = [];
    this.groupRange.clear();

    const grouped = d3.group(tasks, t => t.parent);
    for (const [parent, list] of grouped.entries()) {
      this.groupRange.set(parent!, {
        start: d3.min(list, d => d.start)!,
        end: d3.max(list, d => d.end)!
      });
      const groupDuration = list.reduce((sum, t) => {
        const dur = Number(t.fields[t.fields.length - 1]);
        return sum + (isNaN(dur) ? 0 : dur);
      }, 0);

      rows.push({
        id: parent!,
        isGroup: true,
        rowKey: `G:${parent}`,
        labelY: parent!,
        duration: groupDuration
      });

      const exp = cache.get(parent!) ?? true;
      if (exp) {
        list.forEach(t =>
          rows.push({
            id: t.id,
            isGroup: false,
            task: t,
            rowKey: `T:${t.id}|${parent}`,
            labelY: t.id
          })
        );
      }
      cache.set(parent!, exp);
    }
    return { visibleRows: rows, expanded: cache };
  }

}
