document.addEventListener("DOMContentLoaded", function () {
  const WORKER_URL = "https://cr-stats.pm00buq.workers.dev";
  const MON_TAG = "v9jjgll0g"; // Ton tag validé

  const form = document.getElementById("search-form");
  const input = document.getElementById("tag-input");
  const out = document.getElementById("search-result");

  if (!form || !input || !out) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const tag = input.value.trim();
    if (tag) search(tag);
  });

  const num = (n) => (n ?? 0).toLocaleString("fr-CH");
  const variantOf = (c) => c.variant ?? "normal";

  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function message(text) {
    out.replaceChildren(el("p", "cr-message", text));
  }

  function cardTile(c, size, variant = "normal") {
    const special = variant !== "normal";
    const src = variant === "evo" ? c.evoImage : variant === "hero" ? c.heroImage : c.image;
    const label = special ? `${c.name} (Évolution)` : c.name;
    const slot = el("div", `cr-slot cr-slot-${size}`);
    const tile = el("div", `cr-tile cr-r-${c.rarity ?? "none"} cr-v-${variant}`);
    if (typeof c.elixir === "number") tile.append(el("span", "cr-el", String(c.elixir)));
    
    const art = el("div", "cr-art");
    const img = document.createElement("img");
    img.src = src; img.alt = label; img.loading = "lazy";
    art.append(img);
    tile.append(art);
    tile.append(el("div", "cr-lv", `Niv. ${c.level}`));
    slot.append(tile);
    return slot;
  }

  function renderHeader(p) {
    const box = el("div", "cr-card");
    box.append(el("h3", "cr-name", p.name), el("p", "cr-sub", `${p.tag} · Niveau ${p.level}`));
    return box;
  }

  function renderStats(p) {
    const box = el("div", "cr-card");
    const items = [
      ["Trophées", num(p.trophies)], ["Record", num(p.bestTrophies)],
      ["Victoires", num(p.wins)], ["Défaites", num(p.losses)],
      ["Niveau max", p.kingTowerLevel ?? "-"], ["Cartes", num(p.collectionLevel)]
    ];
    const grid = el("div", "cr-stats");
    items.forEach(([label, value]) => {
      const s = el("div", "cr-stat");
      s.append(el("span", "cr-stat-value", String(value)), el("span", "cr-stat-label", label));
      grid.append(s);
    });
    box.append(grid);
    return box;
  }

  function renderDeck(p) {
    const box = el("div", "cr-card");
    box.append(el("h4", "cr-title", "Deck actuel"));
    const grid = el("div", "cr-deckgrid");
    (p.deck || []).forEach((c) => grid.append(cardTile(c, "big", variantOf(c))));
    box.append(grid);
    return box;
  }

  function renderBattles(battles) {
    const box = el("div", "cr-card");
    box.append(el("h4", "cr-title", "20 derniers combats"));
    if (!battles || !battles.length) { box.append(el("p", "cr-message", "Aucun combat.")); return box; }
    
    const list = el("div", "cr-battles");
    battles.forEach((b) => {
      const row = el("div", `cr-battle cr-${b.result}`);
      
      const head = el("div");
      head.style.display = "flex";
      head.style.justifyContent = "space-between";
      head.append(
        el("span", "cr-result", b.result === "win" ? "Victoire" : b.result === "loss" ? "Défaite" : "Égalité"),
        el("span", "", `${b.crowns} - ${b.oppCrowns}`)
      );
      
      const meta = el("p", "", `Contre ${b.opponents.join(" & ") || "?"}`);
      meta.style.margin = "4px 0"; meta.style.fontSize = "0.9rem"; meta.style.opacity = ".8";
      
      const cards = el("div");
      cards.style.display = "flex"; cards.style.gap = "4px"; cards.style.marginTop = "8px"; cards.style.flexWrap = "wrap";
      b.cards.forEach((c) => {
        const slot = cardTile(c, "small", variantOf(c));
        slot.style.width = "35px";
        cards.append(slot);
      });
      
      row.append(head, meta, cards);
      list.append(row);
    });
    box.append(list);
    return box;
  }

  function renderAll(data) {
    const wrap = el("div");
    wrap.append(renderHeader(data.player), renderStats(data.player));
    const cols = el("div", "cr-cols");
    cols.append(renderDeck(data.player), renderBattles(data.battles));
    wrap.append(cols);
    return wrap;
  }

  async function search(rawTag) {
    message("Recherche en cours...");
    try {
      const res = await fetch(`${WORKER_URL}?tag=${encodeURIComponent(rawTag)}`);
      if (res.status === 404) return message("Aucun joueur avec ce tag.");
      if (res.status === 400) return message("Tag invalide.");
      if (!res.ok) return message("Erreur, réessaie plus tard.");
      out.replaceChildren(renderAll(await res.json()));
    } catch {
      message("Impossible de contacter le serveur.");
    }
  }

  // Lance la recherche automatiquement au chargement
  input.value = "#" + MON_TAG;
  search(MON_TAG);
});