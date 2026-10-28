async function showPlayerStats() {
  const box = document.getElementById("player-stats");
  try {
    const res = await fetch("data/player.json");
    const p = await res.json();

    const lines = [
      `${p.name} (${p.tag}) - niveau ${p.level}`,
      `Trophées : ${p.trophies} (record : ${p.bestTrophies})`,
      `Victoires : ${p.wins} / Défaites : ${p.losses}`,
      `Victoires 3 couronnes : ${p.threeCrownWins}`,
      `Clan : ${p.clan ?? "aucun"}`,
    ];
    box.innerHTML = "";
    lines.forEach(t => {
      const el = document.createElement("p");
      el.textContent = t;
      box.appendChild(el);
    });

    const deck = document.createElement("div");
    p.deck.forEach(c => {
      const img = document.createElement("img");
      img.src = c.image;
      img.alt = `${c.name} niveau ${c.level}`;
      img.width = 60;
      deck.appendChild(img);
    });
    box.appendChild(deck);

    const date = document.createElement("small");
    date.textContent = `Mis à jour le ${new Date(p.updated).toLocaleDateString("fr-CH")}`;
    box.appendChild(date);
  } catch {
    box.textContent = "Stats indisponibles pour le moment.";
  }
}
showPlayerStats();