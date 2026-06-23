function getCounters() {
  return game.settings.get("terras-fragmentadas", "counters");
}

async function saveCounters(counters) {
  await game.settings.set("terras-fragmentadas", "counters", counters);
  console.log("EMITTING socket event now");
  game.socket.emit("system.terras-fragmentadas", { action: "countersUpdate" });
  CountersHUD.refreshAll();
}

function clamp(value, max) {
  return Math.max(0, Math.min(value, max));
}

export class CountersHUD {

  static render() {
    const all = getCounters();
    const counters = game.user.isGM ? all : all.filter(c => c.visible);
    const isGM = game.user.isGM;

    let existing = document.getElementById("tf-counters-hud");
    if (existing) existing.remove();

    const container = document.createElement("div");
    container.id = "tf-counters-hud";

    let rowsHTML = "";

    for (const c of counters) {
      rowsHTML += `
        <div class="tf-counter-row">
          <div class="tf-counter-info">
            ${isGM
              ? `<input type="text" class="counter-name" data-id="${c.id}" value="${c.name}" />`
              : `<span class="counter-name-static">${c.name}</span>`
            }
            <div class="tf-counter-controls">
              ${isGM
                ? `
                  <button type="button" class="counter-minus" data-id="${c.id}">−</button>
                  <input type="number" class="counter-value-input" data-id="${c.id}" value="${c.value}" />
                  <span class="tf-slash">/</span>
                  <input type="number" class="counter-max-input" data-id="${c.id}" value="${c.max}" />
                  <button type="button" class="counter-plus" data-id="${c.id}">+</button>
                `
                : `<span class="counter-value-static">${c.value} / ${c.max}</span>`
              }
            </div>
          </div>
          ${isGM ? `
            <button type="button" class="counter-visible-toggle" data-id="${c.id}" title="Visível para jogadores">
              ${c.visible ? "👁" : "🚫"}
            </button>
            <button type="button" class="remove-counter" data-id="${c.id}">🗑</button>
          ` : ""}
        </div>
      `;
    }

    container.innerHTML = `
      <div class="tf-counters-hud">
        ${rowsHTML}
        ${isGM ? `<button type="button" class="add-counter">+ Novo Contador</button>` : ""}
      </div>
    `;

    document.body.appendChild(container);

    if (isGM) {
      container.querySelector(".add-counter")?.addEventListener("click", async () => {
        const counters = getCounters();
        counters.push({ id: foundry.utils.randomID(), name: "Novo Contador", value: 0, max: 10, visible: false });
        await saveCounters(counters);
      });

      container.querySelectorAll(".remove-counter").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = e.currentTarget.dataset.id;
          const counters = getCounters().filter(c => c.id !== id);
          await saveCounters(counters);
        });
      });

      container.querySelectorAll(".counter-name").forEach(input => {
        input.addEventListener("change", async (e) => {
          const id = e.currentTarget.dataset.id;
          const counters = getCounters();
          const entry = counters.find(c => c.id === id);
          if (entry) entry.name = e.currentTarget.value;
          await saveCounters(counters);
        });
      });

      container.querySelectorAll(".counter-plus").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = e.currentTarget.dataset.id;
          const counters = getCounters();
          const entry = counters.find(c => c.id === id);
          if (entry) entry.value = clamp(entry.value + 1, entry.max);
          await saveCounters(counters);
        });
      });

      container.querySelectorAll(".counter-minus").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = e.currentTarget.dataset.id;
          const counters = getCounters();
          const entry = counters.find(c => c.id === id);
          if (entry) entry.value = clamp(entry.value - 1, entry.max);
          await saveCounters(counters);
        });
      });

      container.querySelectorAll(".counter-value-input").forEach(input => {
        input.addEventListener("change", async (e) => {
          const id = e.currentTarget.dataset.id;
          const counters = getCounters();
          const entry = counters.find(c => c.id === id);
          if (entry) entry.value = clamp(Number(e.currentTarget.value) || 0, entry.max);
          await saveCounters(counters);
        });
      });

      container.querySelectorAll(".counter-max-input").forEach(input => {
        input.addEventListener("change", async (e) => {
          const id = e.currentTarget.dataset.id;
          const counters = getCounters();
          const entry = counters.find(c => c.id === id);
          if (entry) {
            entry.max = Math.max(1, Number(e.currentTarget.value) || 1);
            entry.value = clamp(entry.value, entry.max);
          }
          await saveCounters(counters);
        });
      });

      container.querySelectorAll(".counter-visible-toggle").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = e.currentTarget.dataset.id;
          const counters = getCounters();
          const entry = counters.find(c => c.id === id);
          if (entry) entry.visible = !entry.visible;
          await saveCounters(counters);
        });
      });
    }
  }

  static refreshAll() {
    CountersHUD.render();
  }
}