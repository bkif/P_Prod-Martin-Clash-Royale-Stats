document.addEventListener("DOMContentLoaded", function () {
  const WORKER_URL = "https://cr-stats.pm00buq.workers.dev";
  const MON_TAG = "v9jjgll0g";
  const form = document.getElementById("search-form");
  const input = document.getElementById("tag-input");
  const out = document.getElementById("search-result");

  if (!form || !input || !out) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    search(input.value.trim());
  });

  function search(tag) {
    if (!tag) return;
    out.innerHTML = "<p>Recherche en cours...</p>";
    fetch(WORKER_URL + "?tag=" + encodeURIComponent(tag))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) {
          out.innerHTML = "<p style='color:red'>Erreur: " + data.error + "</p>";
          return;
        }
        // Affichage BRUT pour tester si les données arrivent
        var txt = "Nom : " + data.player.name + "<br>";
        txt += "Tag : " + data.player.tag + "<br>";
        txt += "Trophées : " + data.player.trophies + "<br>";
        txt += "Deck (" + data.player.deck.length + " cartes) :<br>";
        data.player.deck.forEach(function(c) {
            txt += "- " + c.name + " (Niv. " + c.level + ")<br>";
        });
        out.innerHTML = "<div style='background:#222; padding:20px; color:#fff; border-radius:10px;'>" + txt + "</div>";
      })
      .catch(function (err) {
        out.innerHTML = "<p style='color:red'>Erreur réseau : " + err.message + "</p>";
      });
  }

  input.value = "#" + MON_TAG;
  search(MON_TAG);
});