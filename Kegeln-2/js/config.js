// --- GLOBALE VARIABLEN & KONFIGURATION ---
let players = ["Michael", "Hilde", "Peter", "Brigitte", "Elke", "Gerhard", "Helga", "Guido", "Anette", "Birgit", "Jo", "Melissa", "Svenja", "Marius"];
let currentGame = "hausnummer";
let grandTotalScores = {};

// Objekt für die Live-Werte der einzelnen Spiele im Speicher

let activeGamesData = {
    hausnummer: {},
    "siebzehn-vier": {},
    rennen: {},
    idiot: {},
    fuchsjagd: {} // <-- NEU
};

let gameOrder = [
    { key: "hausnummer", title: "🏠 Große/Kleine Hausnummer" },
    { key: "siebzehn-vier", title: "🃏 17 und 4" },
    { key: "rennen", title: "🏎️ 6 Tage Rennen" },
    { key: "idiot", title: "🤪 Idiotenkegeln" },
    { key: "fuchsjagd", title: "🦊 Fuchsjagd" } // <-- NEU
];

const gameRules = {
    hausnummer: "3 Würfe. Bei 'Groß' wird eine möglichst hohe dreistellige Zahl gebildet, bei 'Klein' eine möglichst niedrige.",
    "siebzehn-vier": "Kegel nacheinander in die Wurf-Kästchen eintragen. Ziel ist es, so nah wie möglich an die 21 heranzukommen. Wer eine 4 wirft, erhält einen Bonuswurf! Wer über 21 Punkte kommt (überkauft), hakt das Kästchen an und erhält für die Runde -1 Punkt.",
    rennen: "6 Runden Ausdauerrennen. Runde 2 zählt doppelt (x2), Runde 3 dreifach (x3) bis Runde 6 (x6). Höchste Summe gewinnt.",
    idiot: "Spassturnier: Wurf 1 mit LINKS, Wurf 2 RÜCKWÄRTS durch die Beine, Wurf 3 mit RECHTS. Gesamtsumme zählt.",
    fuchsjagd: "Ein Spieler ist der Fuchs. Der Fuchs erhält 2 Vorwürfe (1x links, 1x rechts) und versucht mit seinen Folgewürfen 31 oder mehr Holz zu erreichen. Die Jäger versuchen, den Fuchs einzuholen!" // <-- NEU
};

function initGrandTotalScores() {
    players.forEach(p => {
        if (!grandTotalScores[p]) grandTotalScores[p] = 0;
    });
}