// js/database.js
const WORKER_CARDS_URL = "https://cr-stats.pm00buq.workers.dev/cards";

let database = null;
let loading = null;

async function loadDatabase() {
    if (database) return database;
    if (loading) return loading;

    loading = (async () => {
        try {
            const res = await fetch(WORKER_CARDS_URL, { cache: "force-cache" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const raw = await res.json();

            // L'API renvoie { items: [...] } ou { cards: [...] }
            const items = raw.items ?? raw.cards ?? [];

            // Normalisation pour correspondre à l'ancien format cards.json
            database = {
                cards: items.map(c => ({
                    id: c.id,
                    name: c.name,
                    elixir: c.elixirCost ?? 0,
                    rarity: (c.rarity ?? "common").toLowerCase(),
                    type: guessType(c.name),
                    image: c.iconUrls?.medium ?? "",
                    evoImage: c.iconUrls?.evolutionMedium ?? null,
                    heroImage: c.iconUrls?.heroMedium ?? null,
                    description: "",
                })),
            };

            return database;
        } catch (err) {
            console.error("Erreur chargement cartes :", err);
            document.body.insertAdjacentHTML(
                "afterbegin",
                `<p role="alert" style="background:#b00020;color:#fff;padding:1rem;text-align:center;margin:0">
                    Impossible de charger les cartes. Réessaie plus tard.
                </p>`
            );
            return null;
        } finally {
            loading = null;
        }
    })();

    return loading;
}

// L'API ne fournit pas le type : on le devine par le nom
function guessType(name) {
    const spells = [
        "Zap", "Fireball", "Arrows", "Rocket", "Lightning", "Poison",
        "Freeze", "Mirror", "Rage", "Tornado", "Clone", "Earthquake",
        "Snowball", "The Log", "Barbarian Barrel", "Royal Delivery",
        "Goblin Curse", "Void", "Graveyard", "Heal Spirit"
    ];
    const buildings = [
        "Cannon", "Tesla", "Mortar", "X-Bow", "Inferno Tower",
        "Bomb Tower", "Goblin Cage", "Goblin Hut", "Barbarian Hut",
        "Furnace", "Elixir Collector", "Tombstone"
    ];
    if (spells.some(s => name.includes(s))) return "Sort";
    if (buildings.some(b => name.includes(b))) return "Bâtiment";
    return "Troupe";
}