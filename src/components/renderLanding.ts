import * as d3 from "d3";

export function renderLanding(width: number, height: number) {
    this.landingG.attr("display", null).selectAll("*").remove();

    const bg = this.landingG.append("defs")
        .append("linearGradient")
        .attr("id", "landing-bg")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%");
    bg.append("stop").attr("offset", "0%").attr("stop-color", "#fdfdfd");
    bg.append("stop").attr("offset", "100%").attr("stop-color", "#f0f0f5");

    this.landingG.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "url(#landing-bg)");

    this.landingG.append("text")
        .text("📊 Gantt Visual – Guía rápida")
        .attr("x", width / 2)
        .attr("y", 50)
        .attr("text-anchor", "middle")
        .attr("fill", "#2c3e50")
        .attr("font-size", 26)
        .attr("font-family", "Segoe UI")
        .attr("font-weight", "bold");

    const sections: { title: string; items: string[] }[] = [
        {
            title: "Campos obligatorios",
            items: [
                "📝 Task (Texto) → Nombre de la tarea",
                "📂 Parent (Texto) → Agrupador o categoría",
                "⏳ Start Date (Fecha) → Inicio",
                "🏁 End Date (Fecha) → Fin"
            ]
        },
        {
            title: "Opcionales",
            items: [
                "🔄 Secondary Start/End (Fecha) → Intervalo extra",
                "📏 Duration (Número) → Días/horas",
                "🔗 Predecessor (Texto/Número) → Dependencias",
                "✅ Completion (Número %) → Avance de la tarea"
            ]
        },
        {
            title: "Extras",
            items: [
                "➕ Columns (Texto/Número) → Campos adicionales",
                "💡 Tooltips (Cualquier tipo) → Info al pasar el mouse"
            ]
        }
    ];

    let y = 100;
    const lineHeight = 24;

    sections.forEach(section => {
        this.landingG.append("text")
            .text(section.title)
            .attr("x", 40)
            .attr("y", y)
            .attr("fill", "#34495e")
            .attr("font-size", 18)
            .attr("font-family", "Segoe UI")
            .attr("font-weight", "bold");
        y += lineHeight;

        section.items.forEach(item => {
            this.landingG.append("text")
                .text(item)
                .attr("x", 60)
                .attr("y", y)
                .attr("fill", "#555")
                .attr("font-size", 15)
                .attr("font-family", "Segoe UI");
            y += lineHeight;
        });

        y += 10;
    });

    this.landingG.append("text")
        .text("💡 Tip: Arrastrá y soltá campos en el panel de Power BI")
        .attr("x", width / 2)
        .attr("y", height - 55)
        .attr("text-anchor", "middle")
        .attr("fill", "#888")
        .attr("font-size", 14)
        .attr("font-family", "Segoe UI")
        .attr("font-style", "italic");

    this.landingG.append("text")
        .text("📧 Contacto: nicolas.pastorini@set.ypf.com")
        .attr("x", width / 2)
        .attr("y", height - 30)
        .attr("text-anchor", "middle")
        .attr("fill", "#2c3e50")
        .attr("font-size", 15)
        .attr("font-family", "Segoe UI")
        .attr("font-weight", "bold");
}