const NAV_ITEMS = [
    { href: "./index.html", label: "Accueil" },
    { href: "./cartes.html", label: "Cartes" },
    { href: "./description-cartes.html", label: "Fiches" },
    { href: "./news.html", label: "Nouveautés" },
    { href: "./e-sport.html", label: "E-sport" },
    { href: "./clan_site.html", label: "Clans" },
    { href: "./crl.html", label: "CRL" },
    { href: "./contact.html", label: "Contact" },
    { href: "https://www.youtube.com/@mhlgcr_off", label: "YouTube", external: true },
];

document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector(".nav-links");
    if (!nav) return;

    const current = location.pathname.split("/").pop() || "index.html";
    nav.innerHTML = NAV_ITEMS.map(({ href, label, external }) => {
        const isCurrent = href.endsWith(current);
        const ext = external ? ' target="_blank" rel="noopener"' : "";
        const cur = isCurrent ? ' aria-current="page"' : "";
        return `<a href="${href}"${cur}${ext}>${label}${external ? '<span class="sr"> (nouvel onglet)</span>' : ""}</a>`;
    }).join("");
});