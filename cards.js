let deck = []; // global, accessible partout

async function displayCards() {
    const db = await loadDatabase();
    if (!db) return;

    const container = document.getElementById("cards");
    container.innerHTML = "";

    // 1. Créer les cartes
    db.cards.forEach(card => {
        const element = document.createElement("div");
        element.className = "card";
        element.draggable = true;
        element.dataset.id = card.id;

        element.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", card.id);
        });

        element.innerHTML = `
            <img src="${card.image}">
        `;

        container.appendChild(element);
    });

    // 2. Configurer les slots (une seule fois, après la boucle)
    document.querySelectorAll(".deck-slot").
    forEach(slot => {
        slot.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        slot.addEventListener("drop", (e) => {
            e.preventDefault();
            const cardId = e.dataTransfer.getData("text/plain");
            addCardToDeck(cardId, slot);
        });
    });
}

function addCardToDeck(cardId, slot) {

    const card = database.cards.find(c => c.id === cardId);
    if (!card) return;

    // Ajoute au tableau
    deck.push(cardId);

    // Affiche dans le slot
    slot.innerHTML = "";
    const img = document.createElement("img");
    img.src = `${card.image}`;
    slot.appendChild(img);
}

displayCards();