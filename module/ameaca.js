const RESISTENCIA_MAX = {
  lacaio: 1,
  adversario: 2,
  elite: 3,
  chefe: 4,
  lenda: 5
};

export class AmeacaSheet extends foundry.appv1.sheets.ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "systems/terras-fragmentadas/templates/actor/ameaca-sheet.html",
      classes: ["terras-fragmentadas", "sheet", "actor", "ameaca"]
    });
  }

  getData() {
    return {
      actor: this.actor,
      system: this.actor.system
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    const getMax = () => RESISTENCIA_MAX[this.actor.system.tipoSelecionado] ?? 1;

    const updateMaxDisplay = () => {
      html.find(".resistencia-max-value").text(getMax());
    };

    updateMaxDisplay();

    html.find(".tipo-select").on("change", async (event) => {
      const newTipo = event.currentTarget.value;
      const max = RESISTENCIA_MAX[newTipo] ?? 1;
      const currentResistencia = this.actor.system.resistencia || 0;
      const clamped = Math.min(currentResistencia, max);

      await this.actor.update({
        "system.tipoSelecionado": newTipo,
        "system.resistencia": clamped
      });
    });

    html.find(".resistencia-plus").on("click", async () => {
      const max = getMax();
      const current = this.actor.system.resistencia || 0;
      const value = Math.min(current + 1, max);
      await this.actor.update({ "system.resistencia": value });
    });

    html.find(".resistencia-minus").on("click", async () => {
      const current = this.actor.system.resistencia || 0;
      const value = Math.max(current - 1, 0);
      await this.actor.update({ "system.resistencia": value });
    });

    // =====================
    // ESPECIAIS
    // =====================
    html.find(".add-especial").on("click", async () => {
      const especiais = foundry.utils.deepClone(this.actor.system.especiais || []);
      especiais.push({ id: foundry.utils.randomID(), texto: "" });
      await this.actor.update({ "system.especiais": especiais });
    });

    html.find(".remove-especial").on("click", async (event) => {
      const id = event.currentTarget.dataset.id;
      const especiais = (this.actor.system.especiais || []).filter(e => e.id !== id);
      await this.actor.update({ "system.especiais": especiais });
    });

    html.find(".especial-texto").on("change", async (event) => {
      const id = event.currentTarget.dataset.id;
      const especiais = foundry.utils.deepClone(this.actor.system.especiais || []);
      const entry = especiais.find(e => e.id === id);
      if (entry) entry.texto = event.currentTarget.value;
      await this.actor.update({ "system.especiais": especiais });
    });
  }

  async _updateObject(event, formData) {
    return super._updateObject(event, formData);
  }
}