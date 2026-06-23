import { CharacterSheet } from "./character.js";
import { NauSheet } from "./nau.js";
import { AmeacaSheet } from "./ameaca.js";
import { CountersHUD } from "./counter-hud.js";

Hooks.once("init", function () {
    
    foundry.documents.collections.Actors.unregisterSheet(
        "core",
        foundry.appv1.sheets.ActorSheet
    );
    
    foundry.documents.collections.Actors.registerSheet(
        "terras-fragmentadas",
        CharacterSheet,
        {
            types: ["character"],
            makeDefault: true
        }
    );
    
    foundry.documents.collections.Actors.registerSheet(
        "terras-fragmentadas",
        NauSheet,
        {
            types: ["nau"],
            makeDefault: true
        }
    );
    
    foundry.documents.collections.Actors.registerSheet(
        "terras-fragmentadas",
        AmeacaSheet,
        {
            types: ["ameaca"],
            makeDefault: true
        }
    );
    
    game.settings.register("terras-fragmentadas", "counters", {
        scope: "world",
        config: false,
        type: Array,
        default: []
    });
    
});

Hooks.on("preCreateActor", (actor, data, options, userId) => {
    
    if (data.type === "character") {
        const defaults = {
            "system.selected": { eixo: "raiz", ritmo: "agil" },
            "system.jogador": "",
            "system.povo": "",
            "system.registro": "",
            "system.eixo": {
                raiz: { label: "Raiz", die: { value: "d4", options: ["d4", "d6", "d8", "d10", "d12"] } },
                pulso: { label: "Pulso", die: { value: "d4", options: ["d4", "d6", "d8", "d10", "d12"] } },
                sintonia: { label: "Sintonia", die: { value: "d4", options: ["d4", "d6", "d8", "d10", "d12"] } },
                artificio: { label: "Artifício", die: { value: "d4", options: ["d4", "d6", "d8", "d10", "d12"] } }
            },
            "system.ritmo": {
                agil: { label: "Ágil", die: { value: "d4", options: ["d4", "d6", "d8", "d10", "d12"] } },
                cuidadoso: { label: "Cuidadoso", die: { value: "d4", options: ["d4", "d6", "d8", "d10", "d12"] } },
                esperto: { label: "Esperto", die: { value: "d4", options: ["d4", "d6", "d8", "d10", "d12"] } },
                intenso: { label: "Intenso", die: { value: "d4", options: ["d4", "d6", "d8", "d10", "d12"] } }
            },
            "system.lastro": { base: 5, current: 5 },
            "system.madicao": "",
            "system.trunfos": [],
            "system.cicatrizes": {
                slots: [false, false, false],
                morte: false
            },
            "system.vicio": {
                slots: [false, false, false, false],
                resquimera: false
            },
            "system.items": {
                carga: {
                    selected: "normal",
                    leve: { slots: [false, false, false] },
                    normal: { slots: [false, false, false, false, false] },
                    pesado: { slots: [false, false, false, false, false, false, false] },
                    posses: ""
                },
                lumens: 0
            },
            "system.vinculos": [],
            "system.ressonancia": {
                slots: [false, false, false, false, false],
                pontosAvanco: 0
            },
            "system.dadosExtras": {
                equipamento: { label: "Equipamento", die: { value: "none", options: ["none", "d4", "d6", "d8", "d10", "d12"] } },
                espirito: { label: "Espírito", die: { value: "none", options: ["none", "d8", "d10"] } },
                ajuda: { label: "Ajuda", die: { value: "none", options: ["none", "d6"] } }
            },
            "system.dadosAtrito": {
                dado1: { label: "Dado 1", die: { value: "none", options: ["none", "d6", "d8", "d10", "d12"] } },
                dado2: { label: "Dado 2", die: { value: "none", options: ["none", "d6", "d8", "d10", "d12"] } },
                dado3: { label: "Dado 3", die: { value: "none", options: ["none", "d6", "d8", "d10", "d12"] } }
            }
        };
        actor.updateSource(defaults);
    }
    
    if (data.type === "nau") {
        const defaults = {
            "system.selected": { eixo: "casco" },
            "system.chassi": "",
            "system.eixo": {
                casco: { label: "Casco", base: "d4", die: { value: "d4", options: ["d4", "d6", "d8", "d10", "d12"] } },
                motor: { label: "Motor", base: "d4", die: { value: "d4", options: ["d4", "d6", "d8", "d10", "d12"] } },
                sensores: { label: "Sensores", base: "d4", die: { value: "d4", options: ["d4", "d6", "d8", "d10", "d12"] } },
                velo: { label: "Velo", base: "d4", die: { value: "d4", options: ["d4", "d6", "d8", "d10", "d12"] } }
            },
            "system.ritmoPiloto": {
                die: { value: "d4", options: ["d4", "d6", "d8", "d10", "d12"] }
            },
            "system.integridade": { base: 0, current: 0 },
            "system.recursos": {
                daeirum: { label: "Daeirum", base: "d4", die: { value: "d4", options: ["d4", "d6", "d8", "d10", "d12"] } },
                suprimentos: { label: "Suprimentos", base: "d4", die: { value: "d4", options: ["d4", "d6", "d8", "d10", "d12"] } },
                lumens: 0,
                materia_prima: { label: "Matéria Prima", base: "d4", die: { value: "d4", options: ["d4", "d6", "d8", "d10", "d12"] } }
            },
            "system.detalhes": {
                peculiaridade: "",
                melhorias: []
            },
            "system.dadosAtrito": {
                dado1: { label: "Dado 1", die: { value: "none", options: ["none", "d6", "d8", "d10", "d12"] } },
                dado2: { label: "Dado 2", die: { value: "none", options: ["none", "d6", "d8", "d10", "d12"] } },
                dado3: { label: "Dado 3", die: { value: "none", options: ["none", "d6", "d8", "d10", "d12"] } }
            }
        };
        actor.updateSource(defaults);
    }
    
    if (data.type === "ameaca") {
        const defaults = {
            "system.nome": "",
            "system.type": ["lacaio", "adversario", "elite", "chefe", "lenda"],
            "system.tipoSelecionado": "lacaio",
            "system.resistencia": 0,
            "system.descricao": "",
            "system.especiais": []
        };
        actor.updateSource(defaults);
    }
    
});

Hooks.once("ready", function () {
    CountersHUD.refreshAll();
    
    game.socket.on("system.terras-fragmentadas", (data) => {
        if (data.action === "countersUpdate") {
            CountersHUD.refreshAll();
        }
    });
});