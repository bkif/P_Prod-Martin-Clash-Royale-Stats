// js/cards.js
let deck = [];
let db = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
    db = await loadDatabase();
    if (!db) return;
    renderCards();
    setupSlots();
}

function renderCards() {
    const container = document.getElementById("cards");
    if (!container) return;

    const frag = document.createDocumentFragment();
    db.cards.forEach(card => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "card";
        el.draggable = true;
        el.dataset.id = card.id;
        el.setAttribute("aria-label", `${card.name}, ${card.elixir} élixir`);
        el.innerHTML = `<img src="${card.image}" alt="${card.name}" loading="lazy" decoding="async">`;

        el.addEventListener("dragstart", e => {
            e.dataTransfer.setData("text/plain", card.id);
            e.dataTransfer.effectAllowed = "copy";
        });

        el.addEventListener("click", () => addToFirstEmpty(card.id));

        frag.appendChild(el);
    });
    container.appendChild(frag);
}

function setupSlots() {
    document.querySelectorAll(".deck-slot").forEach(slot => {
        slot.setAttribute("tabindex", "0");
        slot.setAttribute("role", "button");
        slot.setAttribute("aria-label", "Case du deck, vide");

        slot.addEventListener("dragover", e => {
            e.preventDefault();
            slot.classList.add("drag-over");
        });
        slot.addEventListener("dragleave", () => slot.classList.remove("drag-over"));
        slot.addEventListener("drop", e => {
            e.preventDefault();
            slot.classList.remove("drag-over");
            const id = e.dataTransfer.getData("text/plain");
            if (id) setSlot(slot, id);
        });
        slot.addEventListener("contextmenu", e => {
            e.preventDefault();
            clearSlot(slot);
        });
        slot.addEventListener("keydown", e => {
            if (e.key === "Delete" || e.key === "Backspace") {
                e.preventDefault();
                clearSlot(slot);
            }
        });
    });
}

function addToFirstEmpty(id) {
    const slot = [...document.querySelectorAll(".deck-slot")].find(s => !s.dataset.cardId);
    if (!slot) return;
    setSlot(slot, id);
}

function setSlot(slot, id) {
    const card = db.cards.find(c => c.id === id);
    if (!card) return;
    slot.dataset.cardId = id;
    slot.innerHTML = `<img src="${card.image}" alt="${card.name}">`;
    slot.setAttribute("aria-label", `${card.name} dans le deck`);
    sync();
}

function clearSlot(slot) {
    delete slot.dataset.cardId;
    slot.innerHTML = "";
    slot.setAttribute("aria-label", "Case du deck, vide");
    sync();
}

function sync() {
    deck = [...document.querySelectorAll(".deck-slot")]
        .filter(s => s.dataset.cardId)
        .map(s => s.dataset.cardId);
    updateElixir();
}

function updateElixir() {
    const out = document.getElementById("average-elixir");
    if (!out) return;
    if (!deck.length) {
        out.textContent = "Élixir moyen : —";
        return;
    }
    const total = deck.reduce((sum, id) => {
        const c = db.cards.find(c => c.id === id);
        return sum + (Number(c?.elixir) || 0);
    }, 0);
    out.textContent = `Élixir moyen : ${(total / deck.length).toFixed(1)}`;
}