# Server und statische App in einem Bild.
# Node 24: node:sqlite ist dort stabil, kein Schalter nötig.
FROM node:24-slim

WORKDIR /app

# Keine Laufzeit-Abhängigkeiten – es wird nichts installiert.
COPY package.json ./
COPY server ./server
COPY js ./js
COPY css ./css
COPY icons ./icons
COPY index.html datenschutz.html impressum.html manifest.webmanifest sw.js ./

# Datenbank liegt auf einem beständigen Volume
ENV DB_PATH=/data/trainer.db
ENV PORT=8787
VOLUME ["/data"]
EXPOSE 8787

RUN useradd --system --uid 10001 trainer \
 && mkdir -p /data && chown -R trainer:trainer /data /app
USER trainer

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/index.js"]
