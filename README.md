# STM32WBA Web Bluetooth® Interface

**Démonstration temps réel** combinant **ST60 (60 GHz)**, **STM32MP25** et **Nucleo-WBA55CG** pour mesurer et visualiser **débit** et **latence** sur le Web via **Bluetooth® Low Energy**.

🔗 **Démo en ligne :** https://dalalameziane.github.io/st60-web-interface-main/

---

## TL;DR
- 📶 **ST60** : lien sans fil 60 GHz, jusqu’à ~6 Gb/s, latence imperceptible (< 1 ms) 
- 🧠 **STM32MP25** : ping + iperf3 sous Linux, agrégation & envoi des métriques en UART 
- 🔗 **Nucleo-WBA55CG** : service BLE custom, notifications vers le navigateur 
- 📊 **Interface Web** : graphiques temps réel (React/Chart.js), QR code pour accès immédiat 
- 🧪 **Robuste** : remontée à 0 auto si la donnée est “stale” (anti-gel en cas de coupure)

---

## Architecture (résumé)
- **ST60 (TX/RX)** : remplace un câble court portée → flux Ethernet.
- **STM32MP25** : 
- `ping` continu (latence 1 Hz) 
- `iperf3` sur 10 s à la demande (débit) 
- publication des valeurs en UART → WBA
- **Nucleo-WBA55CG** : reçoit UART, notifie BLE (`L:<ms>`, `D:<Mbps>`) au navigateur.
- **Web** : se connecte en BLE, affiche les courbes (Throughput / Latency), bouton **GO** pour lancer le test de débit.

---

## Matériel utilisé
- 2× modules **ST60** (TX/RX – lien 60 GHz) 
- 1× **STM32MP25** (Linux, ping/iperf3 + script Python) 
- 1× **Nucleo-WBA55CG** (BLE 5.x) 
- (Option) **Caméra IP** / **Switch** selon la démo 
- 1× **PC** (serveur `iperf3`)

---

## Comment utiliser la démo
1. **Lancer** `iperf3` serveur sur le PC cible : `iperf3 -s` 
2. **Scanner** le QR code (ou ouvrir le lien de la démo). 
3. **Connecter** la carte WBA depuis le navigateur (Web Bluetooth®). 
4. Basculer **Notify ON** → la latence s’affiche en continu. 
5. Cliquer **Measure throughput (10 s)** → lancement `iperf3` côté MP25, graphique débit en direct. 
6. En cas de coupure, les valeurs expirées repassent automatiquement à **0** et repartent dès rétablissement.

> Navigateurs : **Chrome / Edge** (Desktop & Android). Safari iOS n’active pas officiellement Web Bluetooth.

---

## Sécurité & confidentialité
- Aucune donnée envoyée vers le cloud : tout reste **local** entre la carte et votre navigateur.
- Pas de stockage d’informations personnelles côté site.

---

## Piles & outils
- **React 18**, **Chart.js**, **Bootstrap** 
- **Web Bluetooth API** 
- **STM32Cube FW WBA**, **Linux/Python** (ping, iperf3) 
- **GitHub Pages** pour l’hébergement

---
