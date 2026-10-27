const WORKER_URL = "https://cr-stats.pm00buq.workers.dev";

const form = document.getElementById("search-form");
const input = document.getElementById("tag-input");
const out = document.getElementById("search-result");

function line(text) {
  const p = document.createElement("p");
  p.textContent = text;
  return p;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  out.replaceChildren(line("Recherche en cours..."));

  try {
    const res = await fetch(`${WORKER_URL}?tag=${encodeURIComponent(input.value)}`);
    const p = await res.json();

    if (res.status === 404) return out.replaceChildren(line("Aucun joueur avec ce tag."));
    if (res.status === 400) return out.replaceChildren(line("Tag invalide."));
    if (!res.ok) return out.replaceChildren(line("Erreur, réessaie plus tard."));

    const deck = document.createElement("div");
    p.currentDeck.forEach((c) => {
      const img = document.createElement("img");
      img.src = c.iconUrls.medium;
      img.alt = `${c.name} niveau ${c.level}`;
      img.width = 60;
      img.referrerPolicy = "no-referrer";
      deck.appendChild(img);
    });

    out.replaceChildren(
      line(`${p.name} (${p.tag}) - niveau ${p.expLevel}`),
      line(`Trophées : ${p.trophies} (record : ${p.bestTrophies})`),
      line(`Victoires : ${p.wins} / Défaites : ${p.losses}`),
      line(`Victoires 3 couronnes : ${p.threeCrownWins}`),
      line(`Clan : ${p.clan?.name ?? "aucun"}`),
      deck
    );
  } catch {
    out.replaceChildren(line("Impossible de contacter le serveur."));
  }
});