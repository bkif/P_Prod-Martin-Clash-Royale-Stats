let database = null;

async function loadDatabase() {

    try {

        const response = await fetch("data/cards.json");

        if (!response.ok) {
            throw new Error("Impossible de charger cards.json");
        }

        database = await response.json();

        console.log(
            `${database.cards.length} cartes chargées`
        );

        return database;

    } catch (error) {

        console.error(error);

        return null;
    }
}