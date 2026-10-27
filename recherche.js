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

// dans le jeu, les 2 premiers emplacements du deck sont les emplacements évolution
const EVO_SLOTS = 2;

const num = (n) => (n ?? 0).toLocaleString("fr-CH");

// textContent partout : un pseudo ne peut pas injecter de HTML
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
  const wrap = el(
    "div",
    `cr-cardimg cr-cardimg-${size} ${special ? "cr-special" : "cr-r-" + (c.rarity ?? "none")}`
  );
  wrap.title = special ? `${c.name} (${variant === "evo" ? "Évolution" : "Héros"})` : c.name;
  const img = document.createElement("img");
  img.src = src;
  img.alt = wrap.title;
  img.loading = "lazy";
  img.referrerPolicy = "no-referrer";
  wrap.append(img, el("span", "cr-lvl", `Niv. ${c.level}`));
  return wrap;
}

function renderHeader(p) {
  const box = el("div", "cr-card");
  box.append(
    el("h3", "cr-name", p.name),
    el("p", "cr-sub", `${p.tag} · Niveau ${p.level}${p.clan ? " · " + p.clan : ""}`)
  );
  return box;
}

function renderProfile({ player: p, chests }) {
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
  box.append(grid, el("h4", "cr-title", "Deck actuel"));

  const deck = el("div", "cr-deck");
  let evoUsed = 0;
  p.deck.forEach((c) => {
    if (c.evo && evoUsed < EVO_SLOTS) {
      evoUsed++;
      deck.append(cardTile(c, "big", "evo"));
    } else {
      deck.append(cardTile(c, "big"));
    }
  });
  p.tower.forEach((c) => deck.append(cardTile(c, "big")));
  box.append(deck);

  if (chests.length) {
    box.append(
      el("h4", "cr-title", "Prochains coffres"),
      el("p", "cr-meta", chests.join("  →  "))
    );
  }
  return box;
}

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
          const tiles = [cardTile(c, "mid")];
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

function renderBattles(battles) {
  const box = el("div", "cr-card");
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

    const cards = el("div", "cr-deck cr-deck-small");
    b.cards.forEach((c) =>
      cards.append(cardTile(c, "small", c.evo ? "evo" : c.hero ? "hero" : "normal"))
    );

    row.append(head, meta, cards);
    list.append(row);
  });
  box.append(list);
  return box;
}

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

function renderAll(data) {
  const wrap = el("div");
  const nav = el("div", "cr-tabs");
  const body = el("div");

  const panels = [
    ["Profil", () => renderProfile(data)],
    ["Cartes", () => renderCards(data.cards)],
    ["Classé", () => renderRanked(data.ranked)],
    ["Combats", () => renderBattles(data.battles)],
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