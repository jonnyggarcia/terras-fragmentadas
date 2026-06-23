const { mergeObject } = foundry.utils;

export class CharacterSheet extends foundry.appv1.sheets.ActorSheet {
    
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "systems/terras-fragmentadas/templates/actor/character-sheet.html",
            classes: ["terras-fragmentadas", "sheet", "actor"]
        });
    }
    
    
    async _rollTF(event) {
        event.preventDefault();
        
        const actor = this.actor;
        const system = actor.system;
        
        const dieToNumber = (d) => Number(d.replace("d", ""));
        
        const selectedEixo = system?.selected?.eixo;
        const selectedRitmo = system?.selected?.ritmo;
        
        const core = [];
        const atrito = [];
        
        const addCore = (label, die, type, color) => {
            if (die && die !== "none") {
                core.push({
                    label,
                    sides: dieToNumber(die),
                    type,
                    color
                });
            }
        };
        
        const addAtrito = (label, die) => {
            if (die && die !== "none") {
                atrito.push({
                    label,
                    sides: dieToNumber(die)
                });
            }
        };
        
        // =====================
        // CORE DICE
        // =====================
        addCore(
            `Eixo (${selectedEixo})`,
            system?.eixo?.[selectedEixo]?.die?.value,
            system?.eixo?.[selectedEixo]?.die?.value,
            "black"
        );
        
        addCore(
            `Ritmo (${selectedRitmo})`,
            system?.ritmo?.[selectedRitmo]?.die?.value,
            system?.ritmo?.[selectedRitmo]?.die?.value,
            "black"
        );
        
        addCore(
            "Equipamento",
            system?.dadosExtras?.equipamento?.die?.value,
            system?.dadosExtras?.equipamento?.die?.value,
            "blue"
        );
        
        addCore(
            "Espírito",
            system?.dadosExtras?.espirito?.die?.value,
            system?.dadosExtras?.espirito?.die?.value,
            "purple"
        );
        
        addCore(
            "Ajuda",
            system?.dadosExtras?.ajuda?.die?.value,
            system?.dadosExtras?.ajuda?.die?.value,
            "orange"
        );
        
        // =====================
        // ATRITO DICE
        // =====================
        const atritoData = system?.dadosAtrito || {};
        Object.entries(atritoData).forEach(([key, val]) => {
            addAtrito(`Atrito (${key})`, val?.die?.value);
        });
        
        // =====================
        // CORE ROLLS
        // =====================
        let coreSuccesses = 0;
        let coreOnes = 0;
        
        let coreHTML = `<h3>Dados de Identidade</h3><ul>`;
        
        for (const p of core) {
            const roll = new Roll(`1d${p.sides}`);
            await roll.evaluate();
            
            const total = roll.total;
            
            const success = total >= 5;
            if (success) coreSuccesses++;
            
            if (total === 1) coreOnes++;
            
            coreHTML += `
        <li>
          <strong style="color:${p.color}">
            ${p.label} (${p.type})
          </strong>
          :
          <span style="color:${success ? "green" : "black"}">
            ${total}
          </span>
        </li>
      `;
        }
        
        coreHTML += `</ul>`;
        
        // =====================
        // ATRITO ROLLS
        // =====================
        let atritoSuccesses = 0;
        let atritoHTML = `<h3>Atrito</h3><ul>`;
        
        for (const p of atrito) {
            const roll = new Roll(`1d${p.sides}`);
            await roll.evaluate();
            
            const total = roll.total;
            
            const success = total >= 5;
            if (success) atritoSuccesses++;
            
            atritoHTML += `
        <li>
          <strong style="color:red">${p.label}</strong> :
          <span style="color:${success ? "green" : "black"}">
            ${total}
          </span>
        </li>
      `;
        }
        
        atritoHTML += `</ul>`;
        
        // =====================
        // FINAL RULES
        // =====================
        let finalSuccesses = coreSuccesses - atritoSuccesses;
        
        if (coreSuccesses === 0 && atritoSuccesses > 0) {
            finalSuccesses = -atritoSuccesses;
        }
        
        let isKatastrofe = coreOnes >= 3;
        
        let impact = "";
        
        if (isKatastrofe) {
            impact = "KATASTROFE";
        } else if (finalSuccesses >= 3) {
            impact = "Impacto Espetacular";
        } else if (finalSuccesses === 1) {
            impact = "Impacto Positivo";
        } else if (finalSuccesses === 0) {
            impact = "Impacto Neutro";
        } else if (finalSuccesses === -1) {
            impact = "Impacto Negativo";
        } else {
            impact = "Impacto Desastroso";
        }
        
        // =====================
        // OUTPUT
        // =====================
        let html = `<h2>${actor.name} - Rolagem</h2>`;
        html += coreHTML;
        html += `<hr>`;
        html += atritoHTML;
        
        html += `
      <hr>
      <h3>Totais</h3>
      <p><strong>Total de sucessos:</strong> ${finalSuccesses} - ${impact}</p>
    `;
        
        if (isKatastrofe) {
            html += `
        <div style="
          margin-top: 10px;
          padding: 10px;
          border: 2px solid red;
          background: #220000;
          color: red;
          font-weight: bold;
          font-size: 18px;
          text-align: center;
        ">
          ☠ KATASTROFE ☠
        </div>
      `;
        }
        
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: html
        });
        
        // =====================
        // RESET AFTER ROLL
        // =====================
        const updateData = {};
        
        const extras = system?.dadosExtras || {};
        for (const k of Object.keys(extras)) {
            updateData[`system.dadosExtras.${k}.die.value`] = "none";
        }
        
        const atritoReset = system?.dadosAtrito || {};
        for (const k of Object.keys(atritoReset)) {
            updateData[`system.dadosAtrito.${k}.die.value`] = "none";
        }
        
        await actor.update(updateData);
        
    }
    
    
    activateListeners(html) {
        super.activateListeners(html);
        
        html.find(".roll-tf").on("click", this._rollTF.bind(this));
        
        const locked = this.actor.getFlag("terras-fragmentadas", "baseLocked");
        
        html.find(".base-field").css("pointer-events", locked ? "none" : "auto");
        html.find(".base-field").css("opacity", locked ? 0.5 : 1);
        
        html.find(".unlock-base").on("click", async () => {
            const current = this.actor.getFlag("terras-fragmentadas", "baseLocked") || false;
            const newState = !current;
            
            await this.actor.setFlag("terras-fragmentadas", "baseLocked", newState);
            
            html.find(".base-field").css("pointer-events", newState ? "none" : "auto");
            html.find(".base-field").css("opacity", newState ? 0.5 : 1);
            
            ui.notifications.info(
                newState ? "Valor Base bloqueado" : "Valor Base desbloqueado"
            );
        });
        
        
        // =====================
        // CARGA: only active row's checkboxes clickable
        // =====================
        const updateCargaState = () => {
            const selected = this.actor.system?.items?.carga?.selected;
            
            html.find(".carga-row").each((i, el) => {
                const row = $(el);
                const level = row.data("carga-level");
                const isActive = level === selected;
                
                row.find('input[type="checkbox"]')
                .prop("disabled", !isActive)
                .css("opacity", isActive ? 1 : 0.4)
                .css("cursor", isActive ? "pointer" : "not-allowed");
            });
        };
        
        
        updateCargaState();
        
        html.find('input[name="system.items.carga.selected"]').on("change", async (event) => {
            const newSelected = event.currentTarget.value;
            
            await this.actor.update({
                "system.items.carga.selected": newSelected,
                "system.items.carga.leve.slots": [false, false, false],
                "system.items.carga.normal.slots": [false, false, false, false, false],
                "system.items.carga.pesado.slots": [false, false, false, false, false, false, false]
            });
            
            updateCargaState();   
        });
        
        
        
        // =====================
        // TRUNFOS
        // =====================
        html.find(".add-trunfo").on("click", async () => {
            const trunfos = foundry.utils.deepClone(this.actor.system.trunfos || []);
            trunfos.push({
                id: foundry.utils.randomID(),
                tipo: "",
                nome: "",
                descricao: ""
            });
            await this.actor.update({ "system.trunfos": trunfos });
        });
        
        html.find(".remove-trunfo").on("click", async (event) => {
            const id = event.currentTarget.dataset.id;
            const trunfos = (this.actor.system.trunfos || []).filter(t => t.id !== id);
            await this.actor.update({ "system.trunfos": trunfos });
        });
        
        html.find(".trunfo-tipo").on("change", async (event) => {
            const id = event.currentTarget.dataset.id;
            const trunfos = foundry.utils.deepClone(this.actor.system.trunfos || []);
            const entry = trunfos.find(t => t.id === id);
            if (entry) entry.tipo = event.currentTarget.value;
            await this.actor.update({ "system.trunfos": trunfos });
        });
        
        html.find(".trunfo-nome").on("change", async (event) => {
            const id = event.currentTarget.dataset.id;
            const trunfos = foundry.utils.deepClone(this.actor.system.trunfos || []);
            const entry = trunfos.find(t => t.id === id);
            if (entry) entry.nome = event.currentTarget.value;
            await this.actor.update({ "system.trunfos": trunfos });
        });
        
        html.find(".trunfo-descricao").on("change", async (event) => {
            const id = event.currentTarget.dataset.id;
            const trunfos = foundry.utils.deepClone(this.actor.system.trunfos || []);
            const entry = trunfos.find(t => t.id === id);
            if (entry) entry.descricao = event.currentTarget.value;
            await this.actor.update({ "system.trunfos": trunfos });
        });
        
        
        
        
        // =====================
        // VÍNCULOS
        // =====================
        html.find(".add-vinculo").on("click", async () => {
            const vinculos = foundry.utils.deepClone(this.actor.system.vinculos || []);
            vinculos.push({
                id: foundry.utils.randomID(),
                texto: ""
            });
            await this.actor.update({ "system.vinculos": vinculos });
        });
        
        html.find(".remove-vinculo").on("click", async (event) => {
            const id = event.currentTarget.dataset.id;
            const vinculos = (this.actor.system.vinculos || []).filter(v => v.id !== id);
            await this.actor.update({ "system.vinculos": vinculos });
        });
        
        html.find(".vinculo-texto").on("change", async (event) => {
            const id = event.currentTarget.dataset.id;
            const vinculos = foundry.utils.deepClone(this.actor.system.vinculos || []);
            const entry = vinculos.find(v => v.id === id);
            if (entry) entry.texto = event.currentTarget.value;
            await this.actor.update({ "system.vinculos": vinculos });
        });
        
        
        // =====================
        // RESSONÂNCIA: clear checkboxes
        // =====================
        html.find(".clear-ressonancia").on("click", async () => {
            const cleared = new Array(5).fill(false);
            await this.actor.update({ "system.ressonancia.slots": cleared });
        });    
        
        
        
        // =====================
        // CAP CURRENT DIE AT BASE VALUE
        // =====================
        const DIE_ORDER = ["d4", "d6", "d8", "d10", "d12"];
        const dieIndex = (d) => DIE_ORDER.indexOf(d);
        
        html.find('select[name$=".die.value"]').on("change", async (event) => {
            const select = event.currentTarget;
            const name = select.name; // e.g. "system.eixo.raiz.die.value"
            const basePath = name.replace(".die.value", ".base");
            const baseValue = foundry.utils.getProperty(this.actor, basePath);
            
            if (baseValue == null) return; // field has no base (e.g. Ritmo) — skip
            
            const newValue = select.value;
            
            if (dieIndex(newValue) > dieIndex(baseValue)) {
                select.value = baseValue; // immediate visual correction
                await this.actor.update({ [name]: baseValue });
            }
        });
        
    }
    
    getData() {
        return {
            actor: this.actor,
            system: this.actor.system
        };
    }
    
    async _updateObject(event, formData) {
        
        const path = "system.lastro";
        if (formData[path] !== undefined) {
            formData[path] = Number(formData[path]);
        }
        
        const lumensPath = "system.items.lumens";
        if (formData[lumensPath] !== undefined) {
            formData[lumensPath] = Number(formData[lumensPath]);
        }
        
        const pontosPath = "system.ressonancia.pontosAvanco";
        if (formData[pontosPath] !== undefined) {
            formData[pontosPath] = Number(formData[pontosPath]);
        }
        
        return super._updateObject(event, formData);
    }
    
}



