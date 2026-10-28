// recherche.js
document.addEventListener("DOMContentLoaded", function () {
  const WORKER_URL = "https://cr-stats.pm00buq.workers.dev";
  const MON_TAG = "v9jjgll0g";

  const form = document.getElementById("search-form");
  const input = document.getElementById("tag-input");
  const out = document.getElementById("search-result");

  if (!form || !input || !out) {
    console.error("[recherche] éléments manquants :", { form, input, out });
    return;
  }

  // ✅ LE FIX : on bloque la soumission native AVANT tout
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const tag = input.value.trim();
    if (!tag) return;
    search(tag);
    return false;
  });

  const LEAGUES = {
    1: "Maître I", 2: "Maître II", 3: "Maître III", 4: "Champion",
    5: "Grand Champion", 6: "Champion Royal", 7: "Champion Ultime",
  };
  const RESULT_LABEL = { win: "Victoire", loss: "Défaite", draw: "Égalité" };
  const num = (n) => (n ?? 0).toLocaleString("fr-CH");

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
    const label = special
      ? `${c.name} (${variant === "evo" ? "Évolution" : "Héros"})`
      : c.name;
    const slot = el("div", `cr-slot cr-slot-${size}`);
    const tile = el("div", `cr-tile cr-r-${c.rarity ?? "none"} cr-v-${variant}`);
    tile.title = label;
    if (typeof c.elixir === "number") tile.append(el("span", "cr-el", String(c.elixir)));
    const art = el("div", "cr-art");
    const img = document.createElement("img");
    img.src = src;
    img.alt = label;
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    art.append(img);
    tile.append(art);
    tile.append(el("div", "cr-lv", size === "small" ? String(c.level) : `Niveau ${c.level}`));
    slot.append(tile);
    return slot;
  }

  function renderHeader(p) {
    const box = el("div", "cr-card");
    box.append(
      el("h3", "cr-name", p.name),
      el("p", "cr-sub", `${p.tag} · Niveau ${p.level}${p.clan ? " · " + p.clan : ""}`)
    );
    return box;
  }

  function renderStats(p) {
    const box = el("div", "cr-card");
    const total = p.wins + p.losses;
    const items = [
      ["Trophées", num(p.trophies)],
      ["Record", num(p.bestTrophies)],
      ["Victoires", num(p.wins)],
      ["Défaites", num(p.losses)],
      ["Taux de victoire", total ? ((p.wins / total) * 100).toFixed(1) + " %" : "-"],
      ["3 couronnes", num(p.threeCrownWins)],
      ["Combats", num(p.battleCount)],
      ["Niveau tour du roi", p.kingTowerLevel ?? "-"],
      ["Niveau de collection", num(p.collectionLevel)],
      ["Cartes données", num(p.totalDonations)],
      ["Victoires guerre", num(p.warDayWins)],
      ["Carte favorite", p.favouriteCard ?? "-"],
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

  const ORDER = { evo: 0, hero: 1, normal: 2 };
  const variantOf = (c) => c.variant ?? "normal";

  function renderDeck(p) {
    const box = el("div", "cr-card");
    box.append(el("h4", "cr-title", "Deck actuel"));
    const sorted = [...p.deck].sort((a, b) => ORDER[variantOf(a)] - ORDER[variantOf(b)]);
    const grid = el("div", "cr-deckgrid");
    sorted.forEach((c) => grid.append(cardTile(c, "big", variantOf(c))));
    box.append(grid);
    return box;
  }

  function renderBattles(battles) {
    const box = el("div", "cr-card");
    box.append(el("h4", "cr-title", "20 derniers combats"));
    if (!battles.length) {
      box.append(el("p", "cr-message", "Aucun combat récent."));
      return box;
    }
    const list = el("div", "cr-battles");
    battles.forEach((b) => {
      const row = el("div", `cr-battle cr-${b.result}`);
      const head = el("div", "cr-battle-head");
      head.append(
        el("span", "cr-result", RESULT_LABEL[b.result]),
        el("span", "cr-score", `${b.crowns} - ${b.oppCrowns}`)
      );
      const meta = el(
        "p", "cr-meta",
        `${String(b.mode).replaceAll("_", " ")} · contre ${b.opponents.join(" & ") || "?"}`
      );
      const cards = el("div", "cr-deck-small");
      b.cards.forEach((c) => cards.append(cardTile(c, "small", variantOf(c))));
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
      const data = await res.json();
      out.replaceChildren(renderAll(data));
    } catch {
      message("Impossible de contacter le serveur.");
    }
  }

  input.value = "#" + MON_TAG;
  search(MON_TAG);
});