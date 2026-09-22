async function displayCards() {

    const db = await loadDatabase();
    if (!db) return;

    const container = document.getElementById("cards");
    container.innerHTML = "";

    db.cards.forEach(card => {

        const element = document.createElement("div");
        element.className = `card rarity-${card.rarity} variant-${card.variant}`;

        element.innerHTML = `
            <img
                src="${card.image}"
                alt="${card.name}"
                class="card-image"
                onerror="this.style.display='none'"
            >

            <h2>${card.name}</h2>

            ${badgeVariant(card.variant)}

            <p>💧 Élixir : <strong>${card.elixir}</strong></p>
            <p>⭐ Rareté : ${card.rarity}</p>
            <p>🎯 Type : ${card.category}</p>

            ${card.roles && card.roles.length > 0
                ? `<p>🛠️ ${card.roles.join(", ")}</p>`
                : ""
            }

            ${card.description
                ? `<p class="card-description">${card.description}</p>`
                : ""
            }
        `;

        container.appendChild(element);
    });
}


function badgeVariant(variant) {
    switch (variant) {
        case "evolution": return `<p class="badge badge-evo">⚡ Évolution</p>`;
        case "hero":      return `<p class="badge badge-hero">🦸 Héros</p>`;
        case "champion":  return `<p class="badge badge-champion">👑 Champion</p>`;
        case "temporary": return `<p class="badge badge-temp">⏳ Temporaire</p>`;
        case "tower":     return `<p class="badge badge-tower">🏰 Tour</p>`;
        default:          return "";
    }
}


displayCards();