const WORKER_URL = "https://cr-stats.pm00buq.workers.dev";
const MON_TAG = "v9jjgll0g";

const form = document.getElementById("search-form");
const input = document.getElementById("tag-input");
const out = document.getElementById("search-result");

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

// Cartes nécessaires pour passer au niveau suivant : "rareté:niveau actuel".
// Valeurs lues sur la capture du jeu ; complète avec les autres si tu veux.
// Sans valeur connue, la barre affiche seulement le nombre de cartes possédées.
const NEEDED = {
  "common:11": 1500,
  "rare:11": 400,
  "epic:11": 50,
  "epic:13": 100,
  "legendary:11": 200,
  "champion:11": 6,
};

// icônes dessinées en SVG (chaînes fixes, aucune donnée de joueur dedans)
const DROP_SVG =
  '<svg viewBox="0 0 24 28" aria-hidden="true"><defs><linearGradient id="crDrop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9cff"/><stop offset="1" stop-color="#b62cc4"/></linearGradient></defs><path d="M12 1.5C12 1.5 3.5 11.5 3.5 17.5a8.5 8.5 0 0 0 17 0C20.5 11.5 12 1.5 12 1.5Z" fill="url(#crDrop)" stroke="#5c0f66" stroke-width="1.4"/><ellipse cx="8.6" cy="16" rx="1.9" ry="3.4" fill="#fff" opacity=".55" transform="rotate(18 8.6 16)"/></svg>';
const ARROW_SVG =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 14 8h-3.6v6.5H5.6V8H2z" fill="#3fb6ff" stroke="#0b4a82" stroke-width="1"/></svg>';

const num = (n) => (n ?? 0).toLocaleString("fr-CH");
const variantOf = (c) => c.variant ?? "normal";

// textContent partout : un pseudo ne peut pas injecter de HTML
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

function message(text) {
  out.replaceChildren(el("p", "cr-message", text));
}

/* ---------- carte façon Clash Royale ---------- */

function progressPill(c) {
  const pill = el("div", "cr-prog");
  if (c.level >= MAX_LEVEL) {
    pill.classList.add("cr-prog-max");
    pill.append(el("span", "cr-prog-in", "Niveau max"));
    return pill;
  }
  const needed = NEEDED[`${c.rarity}:${c.level}`];
  if (needed) {
    const fill = el("span", "cr-prog-fill");
    fill.style.width = Math.min(100, (c.count / needed) * 100) + "%";
    pill.append(fill);
  }
  const inner = el("span", "cr-prog-in");
  inner.append(
    icon(ARROW_SVG, "cr-arrow"),
    document.createTextNode(needed ? `${num(c.count)}/${num(needed)}` : num(c.count))
  );
  pill.append(inner);
  return pill;
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
  if (opts.progress) slot.append(progressPill(c));
  return slot;
}

/* ---------- profil ---------- */

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
  const streak =
    p.streak > 0 ? `${p.streak} victoires` : p.streak < 0 ? `${-p.streak} défaites` : "-";

  const items = [
    ["Trophées", num(p.trophies)],
    ["Record", num(p.bestTrophies)],
    ["Arène", p.arena ?? "-"],
    ["Victoires", num(p.wins)],
    ["Défaites", num(p.losses)],
    ["Taux de victoire", total ? ((p.wins / total) * 100).toFixed(1) + " %" : "-"],
    ["3 couronnes", num(p.threeCrownWins)],
    ["Combats", num(p.battleCount)],
    ["Série en cours", streak],
    ["Niveau tour du roi", p.kingTowerLevel ?? "-"],
    ["Niveau de collection", num(p.collectionLevel)],
    ["Cartes données", num(p.totalDonations)],
    ["Victoires guerre de clans", num(p.warDayWins)],
    ["Meilleur défi", `${p.challengeMaxWins ?? 0} victoires`],
    ["Rôle dans le clan", p.clan ? ROLES[p.role] ?? p.role ?? "-" : "-"],
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

  // comme dans le jeu : évolutions puis héros en premier
  const sorted = [...p.deck].sort((a, b) => ORDER[variantOf(a)] - ORDER[variantOf(b)]);
  const grid = el("div", "cr-deckgrid");
  sorted.forEach((c) =>
    grid.append(cardTile(c, "big", variantOf(c), { progress: true, gem: true }))
  );
  box.append(grid);

  const costs = p.deck.map((c) => c.elixir).filter((x) => typeof x === "number");
  const avg = costs.length ? (costs.reduce((a, b) => a + b, 0) / costs.length).toFixed(1) : "-";

  const foot = el("div", "cr-deckfoot");
  const pill = el("div", "cr-avg");
  pill.title = "Élixir moyen";
  pill.append(icon(DROP_SVG, "cr-drop"), el("span", "", avg));
  foot.append(pill);
  p.tower.forEach((c) => foot.append(cardTile(c, "mid", "normal", { progress: false })));
  box.append(foot);

  if (!p.deckFromBattle) {
    box.append(
      el(
        "p",
        "cr-meta",
        "Évolutions et héros devinés d'après les emplacements : aucun combat récent avec ce deck."
      )
    );
  }
  if (chests.length) {
    box.append(
      el("h4", "cr-title", "Prochains coffres"),
      el("p", "cr-meta", chests.join("  →  "))
    );
  }
  return box;
}

function renderBattles(battles) {
  const box = el("div", "cr-card cr-battlepanel");
  box.append(el("h4", "cr-title", "20 derniers combats"));
  if (!battles.length) {
    box.append(el("p", "cr-message", "Aucun combat récent."));
    return box;
  }

  const wins = battles.filter((b) => b.result === "win").length;
  const losses = battles.filter((b) => b.result === "loss").length;
  box.append(el("p", "cr-sub", `${wins} victoires - ${losses} défaites sur ${battles.length} combats`));

  const list = el("div", "cr-battles");
  battles.forEach((b) => {
    const row = el("div", `cr-battle cr-${b.result}`);

    const head = el("div", "cr-battle-head");
    head.append(
      el("span", "cr-result", RESULT_LABEL[b.result]),
      el("span", "cr-score", `${b.crowns} - ${b.oppCrowns}`)
    );
    if (b.trophyChange !== null) {
      const sign = b.trophyChange > 0 ? "+" : "";
      head.append(el("span", "cr-trophy", `${sign}${b.trophyChange} 🏆`));
    }

    const date = new Date(b.time).toLocaleString("fr-CH", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
    const meta = el(
      "p",
      "cr-meta",
      `${String(b.mode).replaceAll("_", " ")} · contre ${b.opponents.join(" & ") || "?"} · ${date}`
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

/* ---------- collection ---------- */

function renderCards(cards) {
  const box = el("div", "cr-card");
  if (!cards.length) {
    box.append(el("p", "cr-message", "Aucune carte."));
    return box;
  }
  const avg = cards.reduce((s, c) => s + c.level, 0) / cards.length;
  box.append(
    el("h4", "cr-title", `Collection : ${cards.length} cartes`),
    el(
      "p",
      "cr-sub",
      `Niveau moyen ${avg.toFixed(1)} · ${cards.filter((c) => c.evo).length} évolutions · ${cards.filter((c) => c.hero).length} héros`
    )
  );

  const bar = el("div", "cr-filters");
  const grid = el("div", "cr-grid");
  const buttons = [];
  let current = "all";

  function draw() {
    buttons.forEach(([key, b]) => b.setAttribute("aria-pressed", String(key === current)));
    grid.replaceChildren(
      ...cards
        .filter((c) => current === "all" || c.rarity === current)
        .sort((a, b) => b.level - a.level || a.name.localeCompare(b.name))
        .flatMap((c) => {
          const tiles = [cardTile(c, "mid", "normal", { progress: true })];
          if (c.evo) tiles.push(cardTile(c, "mid", "evo"));
          if (c.hero) tiles.push(cardTile(c, "mid", "hero"));
          return tiles;
        })
    );
  }

  [["all", "Toutes"], ...Object.entries(RARITIES)].forEach(([key, label]) => {
    const b = el("button", "cr-filter", label);
    b.type = "button";
    b.addEventListener("click", () => {
      current = key;
      draw();
    });
    buttons.push([key, b]);
    bar.append(b);
  });

  box.append(bar, grid);
  draw();
  return box;
}

/* ---------- classé ---------- */

function rankedBlock(title, r) {
  const s = el("div", "cr-stat");
  s.append(el("span", "cr-stat-label", title));
  if (!r) {
    s.append(el("span", "cr-stat-value", "Aucune donnée"));
    return s;
  }
  s.append(
    el("span", "cr-stat-value", LEAGUES[r.league] ?? `Ligue ${r.league}`),
    el("span", "cr-stat-label", `${num(r.trophies)} trophées`),
    el(
      "span",
      "cr-stat-label",
      r.rank ? `Classement mondial : #${num(r.rank)}` : "Hors classement mondial"
    )
  );
  return s;
}

function renderRanked(ranked) {
  const box = el("div", "cr-card");
  box.append(el("h4", "cr-title", "Voie des Légendes (classé)"));
  const grid = el("div", "cr-stats");
  grid.append(
    rankedBlock("Saison actuelle", ranked.current),
    rankedBlock("Saison précédente", ranked.last),
    rankedBlock("Meilleure saison", ranked.best)
  );
  box.append(grid);
  return box;
}

/* ---------- badges ---------- */

const prettyBadge = (n) =>
  n
    .replace(/^Mastery/, "Maîtrise ")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z0-9])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

function renderBadges(badges) {
  const box = el("div", "cr-card");
  box.append(el("h4", "cr-title", `${badges.length} badges`));
  const grid = el("div", "cr-badges");
  badges.forEach((b) => {
    const t = el("div", "cr-badge");
    const img = document.createElement("img");
    if (b.image) img.src = b.image;
    img.alt = "";
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    t.append(img, el("span", "cr-badge-name", prettyBadge(b.name)));
    if (b.level !== null) t.append(el("span", "cr-badge-lvl", `Niv. ${b.level}/${b.maxLevel}`));
    if (b.target) t.append(el("span", "cr-badge-lvl", `${num(b.progress)} / ${num(b.target)}`));
    grid.append(t);
  });
  box.append(grid);
  return box;
}

/* ---------- page ---------- */

function renderAll(data) {
  const wrap = el("div");
  const nav = el("div", "cr-tabs");
  const body = el("div");

  const panels = [
    ["Profil", () => renderProfile(data)],
    ["Cartes", () => renderCards(data.cards)],
    ["Classé", () => renderRanked(data.ranked)],
    ["Badges", () => renderBadges(data.badges)],
  ];

  const buttons = panels.map(([label], i) => {
    const b = el("button", "cr-tab", label);
    b.type = "button";
    b.addEventListener("click", () => show(i));
    nav.append(b);
    return b;
  });

  function show(i) {
    buttons.forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
    body.replaceChildren(panels[i][1]()); // construit seulement l'onglet ouvert
  }

  wrap.append(renderHeader(data.player), nav, body);
  show(0);
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

form.addEventListener("submit", (e) => {
  e.preventDefault();
  search(input.value);
});

input.value = "#" + MON_TAG;
search(MON_TAG);