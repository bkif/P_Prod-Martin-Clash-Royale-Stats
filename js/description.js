// js/description.js
let allCards = [];
const filter = { query: "", rarity: "" };

document.addEventListener("DOMContentLoaded", async () => {
    const data = await loadDatabase();
    if (!data) return;
    allCards = data.cards;

    document.getElementById("card-search")?.addEventListener("input", e => {
        filter.query = e.target.value.toLowerCase().trim();
        render();
    });
    document.getElementById("rarity-filter")?.addEventListener("change", e => {
        filter.rarity = e.target.value;
        render();
    });
    render();
});

const RARITY = {
    common:    { label: "Commune",    color: "#9fd0ff" },
    rare:      { label: "Rare",       color: "#ffb347" },
    epic:      { label: "Épique",     color: "#e2a2ff" },
    legendary: { label: "Légendaire", color: "#7ff3f8" },
    champion:  { label: "Champion",   color: "#ffe27a" },
};

function render() {
    const list = document.getElementById("cards-list");
    if (!list) return;

    const cards = allCards.filter(c => {
        const q = !filter.query || c.name.toLowerCase().includes(filter.query);
        const r = !filter.rarity || c.rarity === filter.rarity;
        return q && r;
    });

    if (!cards.length) {
        list.innerHTML = `<p class="empty">Aucune carte ne correspond.</p>`;
        return;
    }

    list.replaceChildren(...cards.map(buildCard));
}

function buildCard(c) {
    const meta = RARITY[c.rarity] || { label: c.rarity || "—", color: "#fff" };
    const article = document.createElement("article");
    article.className = "description-card-box";
    article.id = c.id;
    article.innerHTML = `
        <h4>${c.name}</h4>
        <img src="${c.image}" alt="${c.name}" loading="lazy" decoding="async">
        <div class="card-stats">
            <h2 style="color:${meta.color}">Rareté<br>${meta.label}</h2>
            <h2>Type<br>${c.type ?? "—"}</h2>
        </div>
        <p>${c.description ?? "Description à venir."}</p>
    `;
    return article;
}