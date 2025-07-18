import * as d3 from "d3";

interface ParentToggleButtonsProps {
  container: HTMLElement;
  allExpanded: boolean;
  onChange: (expand: boolean) => void;
}

export function renderParentToggleButtons({ container, allExpanded, onChange }: ParentToggleButtonsProps) {
  const labels = ["Abrir", "Cerrar"];
  const btns = d3.select(container).selectAll("button").data(labels);

  btns.exit().remove();

  btns.join("button")
    .attr("type", "button")
    .text(d => d)
    .attr("class", d => ( (d === "Abrir" && allExpanded) || (d === "Cerrar" && !allExpanded) ) ? "active" : "")
    .on("click", (_, label) => {
      if (label === "Abrir" && !allExpanded) onChange(true);
      if (label === "Cerrar" && allExpanded) onChange(false);
    });
}