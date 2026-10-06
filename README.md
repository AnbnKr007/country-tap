# 🌍 Country Tap: The Ultimate World Map Game

Test your geographical knowledge against the clock or race a friend in real-time! **Country Tap** is a fast-paced, interactive map game built for the browser. 

Play it live here: **[Insert Your GitHub Pages Link Here]**

## ✨ Features
* **Interactive D3.js Map:** Smooth zooming and panning across a highly detailed, sovereign-only political map (includes microstates!).
* **Solo Mode:** Play endlessly and beat your personal high score, saved locally in your browser.
* **1v1 Race Mode:** Connect directly with a friend via a Room ID and race to find the target country first.
* **Zero-Latency Multiplayer:** Uses WebRTC (PeerJS) for direct Peer-to-Peer (P2P) connections. No backend servers, no database, no lag.
* **Dynamic Themes:** Switch between Dark Blue, Pitch Black, All White, and Classic map modes on the fly.
* **Custom Audio:** Built-in Web Audio API synthesizers combined with crisp sound effects.

## 🎮 How to Play

### Solo Mode
1. Click **Play Solo**.
2. Look at the target country at the top of the screen.
3. Find and click it on the map. One mistake and it's Game Over!

### 1v1 Multiplayer
1. Player 1 clicks **Host Game** and copies the generated Room ID.
2. Player 2 pastes the Room ID into the **Join Game** box.
3. The first player to click the correct country gets the point. If you click the wrong country, you instantly lose the match!

## 🛠️ Tech Stack
* **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
* **Map Rendering:** D3.js (GeoJSON data)
* **Networking:** PeerJS (WebRTC)
* **Hosting:** GitHub Pages****
