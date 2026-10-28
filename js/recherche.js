document.addEventListener("DOMContentLoaded", function () {
  const WORKER_URL = "https://cr-stats.pm00buq.workers.dev";
  const MON_TAG = "v9jjgll0g";

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

  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function message(text) {
    out.innerHTML = `<p style="text-align:center;font-size:1.2rem;padding:20px;background:rgba(0,0,0,0.5);border-radius:10px;color:#fff;">${text}</p>`;
  }

  // Création d'une carte avec gestion des Évolutions / Héros
  function cardTile(c) {
    const variant = c.variant || "normal";
    const isEvo = variant === "evo";
    const isHero = variant === "hero";
    
    // On choisit la bonne image
    let imgSrc = c.image;
    if (isEvo && c.evoImage) imgSrc = c.evoImage;
    if (isHero && c.heroImage) imgSrc = c.heroImage;

    const slot = el("div", "cr-slot");
    // On ajoute la classe de la variante pour le halo
    const tile = el("div", `cr-tile cr-r-${c.rarity ?? "common"} cr-v-${variant}`);
    
    if (typeof c.elixir === "number") {
      tile.append(el("span", "cr-el", String(c.elixir)));
    }
    
    const art = el("div", "cr-art");
    const img = document.createElement("img");
    img.src = imgSrc || "./images/logo_clash_royale.png";
    img.onerror = function() { this.src = "./images/logo_clash_royale.png"; };
    img.alt = c.name;
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
    const total = p.wins + p.losses;
    const winRate = total > 0 ? ((p.wins / total) * 100).toFixed(1) + " %" : "-";
    
    const items = [
      ["Trophées", num(p.trophies)], ["Record", num(p.bestTrophies)],
      ["Victoires", num(p.wins)], ["Défaites", num(p.losses)],
      ["Taux de victoire", winRate], ["3 couronnes", num(p.threeCrownWins)],
      ["Combats", num(p.battleCount)], ["Tour du Roi", p.kingTowerLevel ?? "-"],
      ["Niveau Cartes", num(p.collectionLevel)], ["Dons", num(p.totalDonations)],
      ["Guerre", num(p.warDayWins)], ["Carte favorite", p.favouriteCard ?? "-"]
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
    // On trie pour mettre les évolutions en premier (comme dans le jeu)
    const sortedDeck = [...(p.deck || [])].sort((a, b) => {
      const order = { evo: 0, hero: 1, normal: 2 };
      return (order[a.variant || "normal"] || 2) - (order[b.variant || "normal"] || 2);
    });
    sortedDeck.forEach((c) => grid.append(cardTile(c)));
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
      
      const head = el("div", "cr-battle-head");
      const resultIcon = b.result === "win" ? "✔️ Victoire" : b.result === "loss" ? "❌ Défaite" : "Égalité";
      
      head.append(
        el("span", "cr-result", resultIcon),
        el("span", "cr-score", `${b.crowns} - ${b.oppCrowns} 👑`)
      );
      
      const meta = el("p", "cr-meta", `Contre ${b.opponents.join(" & ") || "Inconnu"}`);
      
      const cards = el("div", "cr-deck-small");
      b.cards.forEach((c) => {
        // Ici aussi on affiche la bonne image (évo ou normale)
        const variant = c.variant || "normal";
        let imgSrc = c.image;
        if (variant === "evo" && c.evoImage) imgSrc = c.evoImage;
        if (variant === "hero" && c.heroImage) imgSrc = c.heroImage;

        const img = document.createElement("img");
        img.src = imgSrc || "./images/logo_clash_royale.png";
        img.onerror = function() { this.src = "./images/logo_clash_royale.png"; };
        img.title = c.name;
        cards.append(img);
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
      if (!res.ok) return message("Erreur serveur.");
      const data = await res.json();
      out.replaceChildren(renderAll(data));
    } catch {
      message("Impossible de contacter le serveur.");
    }
  }

  input.value = "#" + MON_TAG;
  search(MON_TAG);
});