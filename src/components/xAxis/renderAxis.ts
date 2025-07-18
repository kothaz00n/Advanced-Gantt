import { renderXAxisTop } from "./renderXAxisTop";
import { renderXAxisBottom } from "./renderXAxisBottom";

export function renderXAxis(ctx: any): void {
  const [xStart, xEnd] = ctx.x.domain();

  ctx.xAxisFixedG.select(".x-axis-bottom").remove();
  ctx.xAxisFixedG.select(".x-axis-top").remove();

  
  renderXAxisTop(ctx, xStart, xEnd);

  renderXAxisBottom(ctx, xStart, xEnd);
}
