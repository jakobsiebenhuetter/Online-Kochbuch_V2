
const container = document.getElementById("rezept-container");
const listElements = document.querySelectorAll(".editierbar");
const bearbeitenBtn = document.getElementById("rezept-bearbeiten");
const rezeptLoeschenBtn = document.getElementById("rezept-löschen");

const titelbearbeiten = document.getElementById("titel");
const beschreibungBearbeiten = document.getElementById("beschreibung");

const zutatenContainer = document.querySelector(".zutat");

if (bearbeitenBtn) {
  bearbeitenBtn.addEventListener("click", () => {
    const speicherButton = document.createElement("button");

    listElements.forEach((item) => {
      if (item.querySelector("input")) return;
      const originalText = item.textContent;
      const input = document.createElement("input");
      input.value = originalText.trim();
      input.dataset.id = item.dataset.id;

      item.innerText = "";
      item.appendChild(input);
    });

    speicherButton.textContent = "Speichern";
    bearbeitenBtn.parentNode.insertBefore(
      speicherButton,
      bearbeitenBtn.nextElementSibling
    );

    speicherButton.addEventListener("click", async () => {
      const titel = titelbearbeiten.querySelector("input");
      const beschreibungen = beschreibungBearbeiten.querySelector("input");
      let zutat = null;

      console.log(zutatenContainer);
      if (zutatenContainer !== null) {
        zutat = Array.from(zutatenContainer.querySelectorAll("input")).map(
          (input) => ({
            id: input.dataset.id,
            name: input.value.trim(),
          })
        );
      }

      const rezept = {
        name: titel.value,
        beschreibung: beschreibungen.value,
        id: bearbeitenBtn.dataset.id,
        zutaten: zutat,
      };

     await fetch("/rezept-bearbeiten", {
        method: "POST",
        body: JSON.stringify(rezept),
        headers: { "Content-Type": "application/json" },
      });
      window.location.reload();
    });
  });
}

if (rezeptLoeschenBtn) {
  rezeptLoeschenBtn.addEventListener("click", async () => {
    window.location.href = "/";
    rezeptId = {
      id: rezeptLoeschenBtn.dataset.id,
    };

   await fetch("/rezept-loeschen", {
      method: "POST",
      body: JSON.stringify(rezeptId),
      headers: { "Content-Type": "application/json" },
    });

  });
}
