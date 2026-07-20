import subprocess
from flask import Flask, jsonify, render_template_string

app = Flask(__name__)

# Hier dein WLAN-Interface eintragen (wlan0, wlp3s0, etc.)
WIFI_INTERFACE = "wlp4s0"
HOTSPOT_SSID = "KegelKlub-Gut-Holz"
HOTSPOT_PW = "1234:4321"

# HTML-Oberfläche im Blau-Türkis-Design
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Linux Hotspot Control</title>
    <style>
        :root {
            --bg-color: #0b192c;
            --card-bg: #1e3e62;
            --text-color: #e2f1e7;
            --accent-teal: #00f2fe;
            --accent-blue: #0072ff;
            --status-off: #ff4b5c;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: radial-gradient(circle at center, #1e3e62 0%, #0b192c 100%);
            color: var(--text-color);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }

        .container {
            background-color: rgba(30, 62, 98, 0.6);
            backdrop-filter: blur(10px);
            padding: 2.5rem;
            border-radius: 16px;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
            border: 1px solid rgba(0, 242, 254, 0.2);
            text-align: center;
            width: 350px;
        }

        h1 {
            font-size: 1.8rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(45deg, var(--accent-teal), var(--accent-blue));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .status-container {
            margin: 2rem 0;
            font-size: 1.2rem;
        }

        .status-badge {
            padding: 0.4rem 1rem;
            border-radius: 20px;
            font-weight: bold;
            transition: all 0.3s ease;
        }

        .status-active {
            background-color: var(--accent-teal);
            color: #0b192c;
            box-shadow: 0 0 15px var(--accent-teal);
        }

        .status-inactive {
            background-color: var(--status-off);
            color: white;
            box-shadow: 0 0 15px var(--status-off);
        }

        .btn {
            background: linear-gradient(135deg, var(--accent-teal) 0%, var(--accent-blue) 100%);
            border: none;
            color: #0b192c;
            padding: 0.8rem 2rem;
            font-size: 1.1rem;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 15px rgba(0, 242, 254, 0.4);
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 242, 254, 0.6);
        }

        .btn:active {
            transform: translateY(1px);
        }

        .info-box {
            margin-top: 1.5rem;
            font-size: 0.9rem;
            color: rgba(226, 241, 231, 0.7);
            border-top: 1px solid rgba(226, 241, 231, 0.1);
            padding-top: 1rem;
        }
    </style>
</head>
<body>

<div class="container">
    <h1>Hotspot Steuerung</h1>
    <div class="status-container">
        Status: <span id="status" class="status-badge status-inactive">Inaktiv</span>
    </div>
    
    <button id="toggleBtn" class="btn" onclick="toggleHotspot()">Einschalten</button>

    <div class="info-box">
        <div id="ssidInfo">SSID: {{ ssid }}</div>
    </div>
</div>

<script>
    let is_active = false;

    function updateUI(status) {
        const statusEl = document.getElementById('status');
        const btnEl = document.getElementById('toggleBtn');
        is_active = status;

        if (is_active) {
            statusEl.innerText = "Aktiv";
            statusEl.className = "status-badge status-active";
            btnEl.innerText = "Ausschalten";
        } else {
            statusEl.innerText = "Inaktiv";
            statusEl.className = "status-badge status-inactive";
            btnEl.innerText = "Einschalten";
        }
    }

    // Aktuellen Status beim Laden abfragen
    async function checkStatus() {
        try {
            let response = await fetch('/status');
            let data = await response.json();
            updateUI(data.active);
        } catch (e) {
            console.error("Fehler beim Statusabruf", e);
        }
    }

    async function toggleHotspot() {
        const action = is_active ? 'stop' : 'start';
        updateUI(!is_active); // Sofortiges visuelles Feedback

        try {
            let response = await fetch(`/${action}`, { method: 'POST' });
            let data = await response.json();
            if (!data.success) {
                alert("Fehler: " + data.message);
                checkStatus(); // Bei Fehler echten Status wiederholen
            }
        } catch (e) {
            alert("Verbindungsfehler zum Backend.");
            checkStatus();
        }
    }

    // Intervall zur regelmäßigen Überprüfung
    checkStatus();
    setInterval(checkStatus, 5000);
</script>

</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE, ssid=HOTSPOT_SSID)

@app.route('/status')
def get_status():
    try:
        # Prüfen, ob der Hotspot auf dem Interface aktiv ist
        result = subprocess.run(["nmcli", "-t", "-f", "DEVICE,STATE", "device"], capture_output=True, text=True)
        is_active = f"{WIFI_INTERFACE}:connected" in result.stdout or f"{WIFI_INTERFACE}:verbunden" in result.stdout
        return jsonify({"active": is_active})
    except Exception as e:
        return jsonify({"active": False, "error": str(e)})

@app.route('/start',methods=['POST'])
def start_hotspot():
    try:
        cmd = f"nmcli device wifi hotspot ssid {HOTSPOT_SSID} password {HOTSPOT_PW} ifname {WIFI_INTERFACE}"
        result = subprocess.run(cmd.split(), capture_output=True, text=True)
        if result.returncode == 0:
            return jsonify({"success": True})
        return jsonify({"success": False, "message": result.stderr})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/stop', methods=['POST'])
def stop_hotspot():
    try:
        cmd = f"nmcli device disconnect {WIFI_INTERFACE}"
        result = subprocess.run(cmd.split(), capture_output=True, text=True)
        if result.returncode == 0:
            return jsonify({"success": True})
        return jsonify({"success": False, "message": result.stderr})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080, debug=True)
