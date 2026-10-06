let database = null;

async function loadDatabase() {
    const response = await fetch("data/cards.json");

    database = await response.json();

    return database;
}