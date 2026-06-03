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
    fuchsjagd: {}, // Wird dynamisch mit w1 bis w8 befüllt
    tannenbaum: {} // <-- NEU!
};

let gameOrder = [
    { key: "hausnummer", title: "🏠 Große/Kleine Hausnummer" },
    { key: "siebzehn-vier", title: "🃏 17 und 4" },
    { key: "rennen", title: "🏎️ 6 Tage Rennen" },
    { key: "idiot", title: "🤪 Idiotenkegeln" },
    { key: "fuchsjagd", title: "🦊 Fuchsjagd" },  
    { key: "tannenbaum", title: "🎄 Tannenbaum (Teams)" } // <-- NEU!
];

const gameRules = {
    hausnummer: "3 Würfe. Bei 'Groß' wird eine möglichst hohe dreistellige Zahl gebildet, bei 'Klein' eine möglichst niedrige.",
    "siebzehn-vier": "Kegel nacheinander in die Wurf-Kästchen eintragen. Am Ende kann im Feld 'Karte' der Wert einer gezogenen Karte addiert werden. Ziel ist es, so nah wie möglich an die 21 heranzukommen. Wer über 21 Punkte kommt (überkauft), hakt das Kästchen an und erhält für die Runde -1 Punkt.",
    rennen: "6 Runden Ausdauerrennen. Runde 2 zählt doppelt (x2), Runde 3 dreifach (x3) bis Runde 6 (x6). Höchste Summe gewinnt.",
    idiot: "Spassturnier: Wurf 1 mit LINKS, Wurf 2 RÜCKWÄRTS durch die Beine, Wurf 3 mit RECHTS. Gesamtsumme zählt.",
    fuchsjagd: "Ein Spieler ist der Fuchs. Der Fuchs erhält 2 Vorwürfe (1x links, 1x rechts) und versucht mit seinen Folgewürfen 31 oder mehr Holz zu erreichen. Die Jäger versuchen, den Fuchs einzuholen!",
    tannenbaum: "Gruppe 1 gegen Gruppe 2! Teilt euch auf. Es muss die Pyramide von 1 bis 9 abgeworfen werden (die 5 braucht fünf Treffer, die 1 und 9 je einen). Trage die geworfene Holzzahl (1-9) bei deinem Namen ein und drücke Enter. Welches Team löscht den Baum zuerst?" // <-- NEU
};

function initGrandTotalScores() {
    players.forEach(p => {
        if (!grandTotalScores[p]) grandTotalScores[p] = 0;
    });
}