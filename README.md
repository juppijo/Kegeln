# 🎳 KegelClub Master Pro

### Die moderne, digitale Kegeltafel für Smartphone, Tablet und PC

**KegelClub Master Pro** ist eine vollständig reaktive Web-Applikation, die traditionelle Kegelabende digitalisiert. Vergiss Kreide, Stift und Papier oder unübersichtliche Tabellen! Mit dieser App lassen sich Spieler verwalten, Wurf-Reihenfolgen flexibel anpassen, verschiedene Kegelspiele protokollieren und die Abendkasse (Strafgelder für Pudel und Stinas) vollautomatisch abrechnen.

Entwickelt mit einem klaren Fokus auf **Mobile-First-Bedienung**, lässt sich die App perfekt auf jedem Smartphone direkt auf der Kegelbahn nutzen.

---

## ✨ Hauptmerkmale (Features)

* 📱 **Voller Smartphone-Modus (Touch-Optimiert):** Extra große Eingabefelder, optimierte Tabellenlayouts und keine störenden UI-Elemente für eine reibungslose Bedienung mit einer Hand.
* 🎨 **5 integrierte Farb-Style Moden (Themes):** Wechsel das Design passend zur Stimmung des Abends im Handumdrehen:
    * 💎 *Blau-Türkis (Edel-Club)* – Das elegante Premium-Design.
    * 🪵 *Klassisch Holz (Rustikal)* – Für die traditionelle Vereins-Kegelbahn.
    * 🌌 *Deep Space (Dunkel)* – Schont die Augen in schummrig beleuchteten Räumen.
    * ⚡ *Neon Cyberpunk (Modern)* – Der futuristische Look für Disco-Bowling und Partykegeln.
    * ☀️ *Clean Light (Hell)* – Perfekt lesbar bei starker Beleuchtung.
* 📺 **Echter Vollbildmodus:** Schalte mit einem Klick in den Fullscreen-Modus, um die App wie eine native App ohne störende Browser-Leisten anzuzeigen.
* 👥 **Dynamische Spielerverwaltung (bis zu 20 Spieler):**
    * Spieler live hinzufügen oder entfernen.
    * **Wurf-Reihenfolge flexibel ändern:** Per Pfeiltasten (`🔼` / `🔽`) kann die Reihenfolge der Spieler jederzeit live angepasst werden.
    * 💾 **Lokale Speicherung:** Die Spielerliste kann direkt im Browser gesichert und beim nächsten Mal automatisch oder manuell wieder geladen werden (`localStorage`).
* 🎯 **Spiele-Navigation mit Sortierfunktion:**
    * Ändere die Reihenfolge der Spiele am Abend per Pfeiltasten (`◀️` / `▶️`), um den Ablauf flexibel zu planen.
    * Integrierte **Spielregeln** für jedes Spiel auf Knopfdruck abrufbar.
* 📊 **Live-Auswertung & Gewinner-Ermittlung:** Ein Klick auf "Auswerten" berechnet automatisch alle Punkte, sortiert die Platzierungen und hebt die Gewinner (🥇, 🥈, 🥉) sowie das Schlusslicht farblich hervor.
* 📐 **Platzsparendes Einklapp-System:** Jedes Verwaltungsfenster lässt sich über die Überschrift komfortabel **ein- und ausklappen** (`🔽` / `🔼`), damit auf kleineren Displays immer das aktuelle Spiel im Fokus bleibt.

---

## 🎲 Unterstützte Spiele

1.  **📊 Kegelbuch / Abrechnung (Kasse):** Verwaltung des Startgeldes sowie automatische Berechnung von Strafen für *Pudel* (0 Holz, z.B. 0,10 €) und *Stinas* (Kranz-Umfahrung/Fehlwürfe, z.B. 0,20 €). Berechnet sekundenschnell den exakten Zahlungsbetrag pro Person.
2.  **🏠 Große / Kleine Hausnummer:** 3 Würfe pro Spieler. Je nach Modus ("Groß" oder "Klein") wird versucht, eine möglichst hohe oder niedrige dreistellige Zahl zu würfeln.
3.  **🃏 17 und 4:** Kegeln bis an das Limit. Wer zu viel wagt und über die 21 Punkte rutscht, hat sich "überkauft" und erhält für die Runde 0 Punkte.
4.  **🏎️ 6 Tage Rennen:** Ein Ausdauer-Klassiker über 6 Runden, bei dem strategisches Können gefragt ist, da die Runden multipliziert werden (Runde 2 zählt doppelt, Runde 3 dreifach, bis Runde 6 sechsfach).
5.  **🤪 Idiotenkegeln:** Das ultimative Spaßturnier! Wurf 1 erfolgt mit links, Wurf 2 rückwärts durch die eigenen Beine und Wurf 3 ganz normal mit rechts.

---

## 🛠️ Technische Details & Struktur

Das Projekt wurde als schlanke, performante Client-Side-Webapplikation ohne schwere Frameworks oder externe Abhängigkeiten gebaut (**Vanilla JS / CSS3 / HTML5**). Das macht die App extrem schnell, ressourcenschonend und offline-fähig.

### Dateistruktur:
```bash
├── index.html        # Struktur des Dashboards, der Tabellen und Steuerungselemente
├── style.css         # Responsives Layout, CSS-Variablen für Themes & Touch-Gesten
└── script.js         # Anwendungslogik, Sortier-Algorithmen, Speicherfunktionen & Berechnungen
```
---
> 🎳 Viel Spass beim Spielen 🎳 😉
