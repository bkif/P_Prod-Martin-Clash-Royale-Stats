  function renderBattles(battles) {
    const box = el("div", "cr-card");
    box.append(el("h4", "cr-title", "20 derniers combats"));
    if (!battles.length) { box.append(el("p", "cr-message", "Aucun combat récent.")); return box; }
    
    const list = el("div", "cr-battles");
    battles.forEach((b) => {
      const row = el("div", `cr-battle cr-${b.result}`);
      
      const head = el("div", "cr-battle-head");
      head.style.display = "flex";
      head.style.justifyContent = "space-between";
      head.style.alignItems = "center";
      
      head.append(
        el("span", "cr-result", b.result === "win" ? "Victoire" : b.result === "loss" ? "Défaite" : "Égalité"),
        el("span", "cr-score", `${b.crowns} - ${b.oppCrowns}`)
      );
      
      const meta = el("p", "cr-meta", `Contre ${b.opponents.join(" & ") || "?"}`);
      meta.style.margin = "4px 0 8px";
      meta.style.fontSize = "0.9rem";
      meta.style.opacity = ".8";
      
      const cards = el("div", "cr-deck-small");
      cards.style.display = "flex";
      cards.style.gap = "4px";
      cards.style.marginTop = "8px";
      cards.style.flexWrap = "wrap";

      b.cards.forEach((c) => {
        const slot = cardTile(c, "small", variantOf(c));
        slot.style.width = "40px"; // petites cartes
        cards.append(slot);
      });
      
      row.append(head, meta, cards);
      list.append(row);
    });
    box.append(list);
    return box;
  }