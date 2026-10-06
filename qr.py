import qrcode

# Ziel-URL
url = "http://10.42.0.1:3000/Gebrauchts-Anweisung.html"

# QR-Code-Objekt konfigurieren
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=10,
    border=4,
)

# Daten hinzufügen und QR-Code generieren
qr.add_data(url)
qr.make(fit=True)

# Bild erstellen (schwarze Pixel auf weißem Hintergrund)
img = qr.make_image(fill_color="black", back_color="white")

# Bild speichern
img.save("gebrauchsanweisung_qr.png")

print("QR-Code erfolgreich als 'gebrauchsanweisung_qr.png' gespeichert!")