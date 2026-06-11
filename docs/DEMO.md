# PackVault Demo Script

Use this short flow for a terminal recording or GIF.

```bash
npm install -g packvault
packvault --version

# Prepare while online.
packvault bundle frontend

# Create a project offline from a local template.
cd ~/Desktop
packvault create react packvault-demo --install
cd packvault-demo

# Inspect the cache.
packvault doctor

# Share cached packages over LAN.
packvault share
```

Second machine on the same Wi-Fi/LAN:

```bash
npm install -g packvault
packvault connect <first-machine-ip>
packvault create react shared-demo --install
```
