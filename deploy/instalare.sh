#!/usr/bin/env bash
# Instalare pe un server proaspăt (Ubuntu/Debian). Rulează ca root:
#   bash deploy/instalare.sh
# Scriptul nu pornește aplicația: la final completezi /etc/equil-nps.env și dai drumul.
set -euo pipefail

FOLDER=/opt/equil-nps
UTILIZATOR=equil

echo "1/5 Node.js 22"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

echo "2/5 Utilizator fără drepturi de administrare"
id -u "$UTILIZATOR" >/dev/null 2>&1 || useradd --system --home "$FOLDER" --shell /usr/sbin/nologin "$UTILIZATOR"

echo "3/5 Folderul aplicației"
mkdir -p "$FOLDER/data"
chown -R "$UTILIZATOR:$UTILIZATOR" "$FOLDER"

echo "4/5 Serviciul systemd"
cp "$(dirname "$0")/equil-nps.service" /etc/systemd/system/
systemctl daemon-reload

echo "5/5 Fișierul de configurare"
if [ ! -f /etc/equil-nps.env ]; then
  cp "$(dirname "$0")/../.env.example" /etc/equil-nps.env
  chmod 600 /etc/equil-nps.env
  chown "$UTILIZATOR:$UTILIZATOR" /etc/equil-nps.env
  echo "   Am copiat .env.example în /etc/equil-nps.env — completează-l acum."
fi

cat <<'URMEAZA'

Gata. Mai ai de făcut:
  1. Copiază codul în /opt/equil-nps (git clone sau rsync).
  2. Completează /etc/equil-nps.env (parolă, domeniu, SMTP, datele firmei).
  3. Verifică:  cd /opt/equil-nps && sudo -u equil env $(grep -v '^#' /etc/equil-nps.env | xargs) npm run verifica
  4. Pornește:  sudo systemctl enable --now equil-nps
  5. Pune Caddy în față (deploy/Caddyfile) pentru HTTPS.
URMEAZA
