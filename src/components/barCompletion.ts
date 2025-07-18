import * as d3 from "d3";

export interface BarCompletionData {
  taskName: string;
  start: Date;
  end: Date;
  completion: number; // entre 0 y 1, o entre 0 y 100
  color: string;
}

export class BarCompletionRenderer {
  private group: d3.Selection<SVGGElement, unknown, null, undefined>;
  private x: d3.ScaleTime<number, number>;
  private y: d3.ScaleBand<string>;
  private barHeight: number;

  constructor(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: d3.ScaleTime<number, number>,
    yScale: d3.ScaleBand<string>,
    barHeight: number
  ) {
    this.group = group;
    this.x = xScale;
    this.y = yScale;
    this.barHeight = barHeight;
  }

  public render(data: BarCompletionData[]) {
    this.group.selectAll(".bar-completion")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar-completion")
      .attr("x", d => this.x(d.start))
      .attr("y", d => this.y(d.taskName) ?? 0)
      .attr("width", d => {
        const total = this.x(d.end) - this.x(d.start);
        const pct = Math.max(0, Math.min(1, d.completion));
        return total * pct;
      })
      .attr("height", this.barHeight)
      .attr("fill", d => d.color)
      .attr("rx", 2)
      .attr("ry", 2);
  }
}
