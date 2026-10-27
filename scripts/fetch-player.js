const fs = require("fs");

const TAG = "TON_TAG";
const headers = { Authorization: `Bearer ${process.env.CR_API_KEY}` };

(async () => {
  const res = await fetch(`https://proxy.royaleapi.dev/v1/players/%23${TAG}`, { headers });
  if (!res.ok) throw new Error(`Erreur API : ${res.status}`);
  const p = await res.json();

  const player = {
    name: p.name,
    tag: p.tag,
    level: p.expLevel,
    trophies: p.trophies,
    bestTrophies: p.bestTrophies,
    wins: p.wins,
    losses: p.losses,
    battleCount: p.battleCount,
    threeCrownWins: p.threeCrownWins,
    arena: p.arena?.name,
    clan: p.clan?.name,
    favouriteCard: p.currentFavouriteCard?.name,
    deck: p.currentDeck.map(c => ({
      name: c.name,
      level: c.level,
      image: c.iconUrls.medium,
    })),
    updated: new Date().toISOString(),
  };

  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync("data/player.json", JSON.stringify(player, null, 2));
})();