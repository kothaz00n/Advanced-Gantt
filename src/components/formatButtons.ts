// src/components/formatButtons.ts
import * as d3 from "d3";

interface FormatButtonsProps {
  container: HTMLElement;
  selectedFormat: string;
  onFormatChange: (fmt: string) => void;
}

export function renderFormatButtons({ container, selectedFormat, onFormatChange }: FormatButtonsProps) {
  // Limpia cualquier contenedor previo
  d3.select(container).selectAll(".btn-container").remove();

  const formatos = ["Hora", "Día", "Mes", "Año", "Todo"];
  const btnContainer = d3.select(container)
    .append("div")
    .attr("class", "btn-container");

  const btns = btnContainer.selectAll("button")
    .data(formatos)
    .enter()
    .append("button")
    .text(fmt => fmt)
    .attr("data-format", fmt => fmt)
    .attr("type", "button")
    .attr("class", fmt => fmt === selectedFormat ? "active" : "");

  btns.on("click", (event, fmt) => {
    onFormatChange(fmt);
    btns.attr("class", d => d === fmt ? "active" : "");
  });
}
