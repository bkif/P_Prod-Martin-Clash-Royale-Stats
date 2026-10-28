// js/database.js
let database = null;
let loading = null;

async function loadDatabase() {
    if (database) return database;
    if (loading) return loading;

    loading = (async () => {
        try {
            const res = await fetch("data/cards.json", { cache: "no-cache" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            database = await res.json();
            return database;
        } catch (err) {
            console.error("Erreur chargement cards.json :", err);
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