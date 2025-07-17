# STM32WBA Web Bluetooth® Interface

Bienvenue sur l’interface Web Bluetooth pour la carte **STM32WBA**, développée pour permettre de visualiser les performance de ST60 via **Bluetooth® Low Energy (BLE)**.

## Démo en ligne

Accédez directement à l’interface web :
[https://dalalameziane.github.io/st60-web-interface-main/](https://dalalameziane.github.io/st60-web-interface-main/)

## Scan me ! ![CodeQR](docs/frame.png)

## Objectif du projet

- Calcul de performance réseau de ST60 à l'aide de Iperf3.
- Envoie de ces données stocké en STM32MP25-DK vers STM32WBA à travers une communication série UART.  
- Transmettre les données en BLE avec la carte WBA.
- Visualiser les données sur une interface web Bluetooth en temps réel
- Afficher les performances du lien (latence, débit, etc.)

## Architecture

![Schéma de l’architecture du système](docs/main_interface.png)

## Technologies utilisées

- **React 18**
- **Bootstrap 5**
- **Web Bluetooth API**
- **STM32Cube FW WBA**
- **GitHub Pages**

## Fonctionnalités

- Connexion à une carte STM32WBA via BLE
- Visualisation temps réel des données UART (MP25 → WBA → BLE)
- Interface responsive pour mobile & desktop
- QR Code pour un accès rapide via smartphone
