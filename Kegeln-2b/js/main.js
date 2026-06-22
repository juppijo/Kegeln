// --- INITIALISIERUNG & EVENT-LISTENERS ---

document.addEventListener("DOMContentLoaded", () => {
    // 1. Aus Speicher laden
    loadPlayersFromStorage(true);
    
    // 2. Ansichten initialisieren
    initGrandTotalScores();
    renderPlayerBadges();
    renderGameSelector();
    switchGame(currentGame);
    updateKegelbuchTable();
    updateGrandTotalTable();

    // 3. Event-Listener Knöpfen zuweisen
    document.getElementById("add-player-btn").addEventListener("click", addPlayer);
    document.getElementById("new-player-name").addEventListener("keypress", (e) => { if(e.key === 'Enter') addPlayer(); });
    document.getElementById("save-players-btn").addEventListener("click", () => savePlayersToStorage(true));
    document.getElementById("load-players-btn").addEventListener("click", () => loadPlayersFromStorage(true));
    document.getElementById("clear-players-btn").addEventListener("click", clearAllPlayers);
});