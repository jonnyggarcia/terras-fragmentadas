export class NauSheet extends foundry.appv1.sheets.ActorSheet {
    
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "systems/terras-fragmentadas/templates/actor/nau-sheet.html",
            classes: ["terras-fragmentadas", "sheet", "Nau"]
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
        
        html.find(".roll-nau").on("click", this._rollNau.bind(this));
        
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
        // MELHORIAS
        // =====================
        html.find(".add-melhorias").on("click", async () => {
            const melhorias = foundry.utils.deepClone(this.actor.system.detalhes?.melhorias || []);
            melhorias.push({
                id: foundry.utils.randomID(),
                texto: ""
            });
            await this.actor.update({ "system.detalhes.melhorias": melhorias });
        });
        
        html.find(".remove-melhorias").on("click", async (event) => {
            const id = event.currentTarget.dataset.id;
            const melhorias = (this.actor.system.detalhes?.melhorias || []).filter(m => m.id !== id);
            await this.actor.update({ "system.detalhes.melhorias": melhorias });
        });
        
        html.find(".melhorias-texto").on("change", async (event) => {
            const id = event.currentTarget.dataset.id;
            const melhorias = foundry.utils.deepClone(this.actor.system.detalhes?.melhorias || []);
            const entry = melhorias.find(m => m.id === id);
            if (entry) entry.texto = event.currentTarget.value;
            await this.actor.update({ "system.detalhes.melhorias": melhorias });
        });    
        
        
        
        // =====================
        // RECURSOS: individual roll buttons
        // =====================
        html.find(".roll-recurso").on("click", async (event) => {
            const key = event.currentTarget.dataset.recurso;
            const label = event.currentTarget.dataset.label;
            
            const die = this.actor.system.recursos?.[key]?.die?.value;
            if (!die || die === "none") {
                ui.notifications.warn("Nenhum dado selecionado.");
                return;
            }
            
            const sides = Number(die.replace("d", ""));
            const roll = new Roll(`1d${sides}`);
            await roll.evaluate();
            
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: `${label} (${die})`
            });
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






    
    async _rollNau(event) {
        event.preventDefault();
        
        const actor = this.actor;
        const system = actor.system;
        
        const dieToNumber = (d) => Number(d.replace("d", ""));
        
        const selectedEixo = system?.selected?.eixo;
        
        const core = [];
        const atrito = [];
        
        const addCore = (label, die, color) => {
            if (die && die !== "none") {
                core.push({ label, sides: dieToNumber(die), color });
            }
        };
        
        const addAtrito = (label, die) => {
            if (die && die !== "none") {
                atrito.push({ label, sides: dieToNumber(die) });
            }
        };
        
        // =====================
        // CORE DICE
        // =====================
        addCore(
            `Eixo (${selectedEixo})`,
            system?.eixo?.[selectedEixo]?.die?.value,
            "black"
        );
        
        addCore(
            "Rítimo do Piloto",
            system?.ritmoPiloto?.die?.value,
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
        
        let coreHTML = `<h3>Dados da Nau</h3><ul>`;
        
        for (const p of core) {
            const roll = new Roll(`1d${p.sides}`);
            await roll.evaluate();
            
            const total = roll.total;
            const success = total >= 5;
            if (success) coreSuccesses++;
            if (total === 1) coreOnes++;
            
            
            coreHTML += `
        <li>
        <strong style="color:${p.color}">${p.label}</strong> (d${p.sides}) :
        <span style="color:${success ? "green" : "black"}">${total}</span>
        </li>
        `;
        }
        
        console.log("Sucessos: " + coreSuccesses);
        
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
                <strong style="color:red">${p.label}</strong> (d${p.sides}) :
                <span style="color:${success ? "green" : "black"}">${total}</span>
                </li>
            `;
        }
        
        console.log("atrito Successes: " + atritoSuccesses);
        
        
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
    





    async _updateObject(event, formData) {

        const path = "system.integridade.current";
        if (formData[path] !== undefined) {
            formData[path] = Number(formData[path]);
        }

        const lumensPath = "system.recursos.lumens";
        if (formData[lumensPath] !== undefined) {
            formData[lumensPath] = Number(formData[lumensPath]);
        }

        const basePath = "system.integridade.base";
        if (formData[basePath] !== undefined) {
            formData[basePath] = Number(formData[basePath]);
        }
        return super._updateObject(event, formData);
    }
}