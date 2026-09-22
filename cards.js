async function displayCards() {

    const db = await loadDatabase();

    if (!db) {
        return;
    }

    const container =
        document.getElementById("cards");

    container.innerHTML = "";

    db.cards.forEach(card => {

        const element =
            document.createElement("div");

        element.className = "card";

        element.innerHTML = `
            <h2>${card.name}</h2>

            <p>
                Élixir :
                <strong>${card.elixir}</strong>
            </p>

            <p>
                Rareté :
                ${card.rarity}
            </p>

            <p>
                Type :
                ${card.category}
            </p>

            ${
                card.isHero
                ? `<p>🦸 Héros</p>`
                : ""
            }

            ${
                card.hasEvolution
                ? `<p>⚡ Évolution disponible</p>`
                : ""
            }

            <p>
                Rôles :
                ${card.roles.join(", ")}
            </p>
        `;

        container.appendChild(element);

    });
}


displayCards();