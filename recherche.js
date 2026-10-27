const WORKER_URL = "https://cr-stats.pm00buq.workers.dev";
const MON_TAG = "v9jjgll0g";

const form = document.getElementById("search-form");
const input = document.getElementById("tag-input");
const out = document.getElementById("search-result");

// crée un élément avec du texte (textContent : pas d'injection HTML via les pseudos)
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

function message(text) {
  out.replaceChildren(el("p", "cr-message", text));
}

function cardImage(c, size) {
  const wrap = el("div", `cr-cardimg cr-cardimg-${size}`);
  const img = document.createElement("img");
  img.src = c.image;
  img.alt = c.name;
  img.loading = "lazy";
  img.referrerPolicy = "no-referrer";
  wrap.append(img, el("span", "cr-lvl", `Niv. ${c.level}`));
  return wrap;
}

function renderProfile(p) {
  const box = el("div", "cr-card");
  box.append(
    el("h3", "cr-name", p.name),
    el("p", "cr-sub", `${p.tag} · Niveau ${p.level}${p.clan ? " · " + p.clan : ""}`)
  );

  const total = p.wins + p.losses;
  const rate = total ? ((p.wins / total) * 100).toFixed(1) + " %" : "-";
  const items = [
    ["Trophées", p.trophies.toLocaleString("fr-CH")],
    ["Record", p.bestTrophies.toLocaleString("fr-CH")],
    ["Victoires", p.wins.toLocaleString("fr-CH")],
    ["Défaites", p.losses.toLocaleString("fr-CH")],
    ["3 couronnes", p.threeCrownWins.toLocaleString("fr-CH")],
    ["Taux de victoire", rate],
  ];
  const grid = el("div", "cr-stats");
  items.forEach(([label, value]) => {
    const s = el("div", "cr-stat");
    s.append(el("span", "cr-stat-value", value), el("span", "cr-stat-label", label));
    grid.append(s);
  });
  box.append(grid);

  const deck = el("div", "cr-deck");
  p.deck.forEach((c) => deck.append(cardImage(c, "big")));
  box.append(el("h4", "cr-title", "Deck actuel"), deck);
  return box;
}

const RESULT_LABEL = { win: "Victoire", loss: "Défaite", draw: "Égalité" };

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
    const meta = el("p", "cr-meta", `${b.mode.replaceAll("_", " ")} · contre ${b.opponents.join(" & ") || "?"} · ${date}`);

    const cards = el("div", "cr-deck cr-deck-small");
    b.cards.forEach((c) => cards.append(cardImage(c, "small")));

    row.append(head, meta, cards);
    list.append(row);
  });
  box.append(list);
  return box;
}

async function search(rawTag) {
  message("Recherche en cours...");
  try {
    const res = await fetch(`${WORKER_URL}?tag=${encodeURIComponent(rawTag)}`);
    if (res.status === 404) return message("Aucun joueur avec ce tag.");
    if (res.status === 400) return message("Tag invalide.");
    if (!res.ok) return message("Erreur, réessaie plus tard.");

    const { player, battles } = await res.json();
    out.replaceChildren(renderProfile(player), renderBattles(battles));
  } catch {
    message("Impossible de contacter le serveur.");
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  search(input.value);
});

// ton tag par défaut, chargé automatiquement
input.value = "#" + MON_TAG;
search(MON_TAG);