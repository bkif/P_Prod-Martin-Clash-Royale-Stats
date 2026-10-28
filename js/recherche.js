// recherche.js — version robuste
(function () {
  const WORKER_URL = "https://cr-stats.pm00buq.workers.dev";
  const MON_TAG = "v9jjgll0g";

  const LEAGUES = {
    1: "Maître I", 2: "Maître II", 3: "Maître III", 4: "Champion",
    5: "Grand Champion", 6: "Champion Royal", 7: "Champion Ultime",
  };
  const RARITIES = {
    common: "Communes", rare: "Rares", epic: "Épiques",
    legendary: "Légendaires", champion: "Champions",
  };
  const ROLES = { leader: "Chef", coLeader: "Chef adjoint", elder: "Aîné", member: "Membre" };
  const RESULT_LABEL = { win: "Victoire", loss: "Défaite", draw: "Égalité" };
  const MAX_LEVEL = 16;

  const NEEDED = {
    "common:11": 1500, "rare:11": 400, "epic:11": 50,
    "epic:13": 100, "legendary:11": 200, "champion:11": 6,
  };

  const DROP_SVG =
    '<svg viewBox="0 0 24 28" aria-hidden="true"><defs><linearGradient id="crDrop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9cff"/><stop offset="1" stop-color="#b62cc4"/></linearGradient></defs><path d="M12 1.5C12 1.5 3.5 11.5 3.5 17.5a8.5 8.5 0 0 0 17 0C20.5 11.5 12 1.5 12 1.5Z" fill="url(#crDrop)" stroke="#5c0f66" stroke-width="1.4"/><ellipse cx="8.6" cy="16" rx="1.9" ry="3.4" fill="#fff" opacity=".55" transform="rotate(18 8.6 16)"/></svg>';
  const ARROW_SVG =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 14 8h-3.6v6.5H5.6V8H2z" fill="#3fb6ff" stroke="#0b4a82" stroke-width="1"/></svg>';

  const num = (n) => (n ?? 0).toLocaleString("fr-CH");
  const variantOf = (c) => c.variant ?? "normal";

  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function icon(svg, className) {
    const s = el("span", className);
    s.innerHTML = svg;
    return s;
  }

  function cardTile(c, size, variant = "normal", opts = {}) {
    const special = variant !== "normal";
    const src = variant === "evo" ? c.evoImage : variant === "hero" ? c.heroImage : c.image;
    const label = special
      ? `${c.name} (${variant === "evo" ? "Évolution" : "Héros"})`
      : c.name;

    const slot = el("div", `cr-slot cr-slot-${size}`);
    const tile = el("div", `cr-tile cr-r-${c.rarity ?? "none"} cr-v-${variant}`);
    tile.title = label;

    if (opts.gem && !special) tile.append(el("span", "cr-gem"));
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

  function renderDeck(p, chests) {
    const box = el("div", "cr-card");
    box.append(el("h4", "cr-title", "Deck actuel"));
    const sorted = [...p.deck].sort((a, b) => ORDER[variantOf(a)] - ORDER[variantOf(b)]);
    const grid = el("div", "cr-deckgrid");
    sorted.forEach((c) => grid.append(cardTile(c, "big", variantOf(c))));
    box.append(grid);
    const costs = p.deck.map((c) => c.elixir).filter((x) => typeof x === "number");
    const avg = costs.length ? (costs.reduce((a, b) => a + b, 0) / costs.length).toFixed(1) : "-";
    const foot = el("div", "cr-deckfoot");
    const pill = el("div", "cr-avg");
    pill.append(icon(DROP_SVG, "cr-drop"), el("span", "", avg));
    foot.append(pill);
    p.tower.forEach((c) => foot.append(cardTile(c, "mid", "normal")));
    box.append(foot);
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

  function renderProfile(data) {
    const wrap = el("div");
    wrap.append(renderStats(data.player));
    const cols = el("div", "cr-cols");
    cols.append(renderDeck(data.player, data.chests), renderBattles(data.battles));
    wrap.append(cols);
    return wrap;
  }

  function renderAll(data) {
    const wrap = el("div");
    wrap.append(renderHeader(data.player), renderProfile(data));
    return wrap;
  }

  function init() {
    const form = document.getElementById("search-form");
    const input = document.getElementById("tag-input");
    const out = document.getElementById("search-result");

    if (!form || !input || !out) {
      console.warn("[recherche] éléments du formulaire introuvables");
      return;
    }

    async function search(rawTag) {
      out.replaceChildren(el("p", "cr-message", "Recherche en cours..."));
      try {
        const res = await fetch(`${WORKER_URL}?tag=${encodeURIComponent(rawTag)}`);
        if (res.status === 404) {
          out.replaceChildren(el("p", "cr-message", "Aucun joueur avec ce tag."));
          return;
        }
        if (res.status === 400) {
          out.replaceChildren(el("p", "cr-message", "Tag invalide."));
          return;
        }
        if (!res.ok) {
          out.replaceChildren(el("p", "cr-message", "Erreur, réessaie plus tard."));
          return;
        }
        const data = await res.json();
        out.replaceChildren(renderAll(data));
      } catch {
        out.replaceChildren(el("p", "cr-message", "Impossible de contacter le serveur."));
      }
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      search(input.value);
    });

    input.value = "#" + MON_TAG;
    search(MON_TAG);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();