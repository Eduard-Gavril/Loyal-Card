# Animazioni LoyalCard

Video di presentazione animati, costruiti in HTML/CSS/JS con i testi di loyalcard.net (`frontend/src/lib/i18n.ts`) e il logo `newlogo.svg`.

| File | Contenuto |
| --- | --- |
| `loyalcard-motion-it.html` | Versione italiana, orizzontale 16:9 (stage 1280×720), 46 s |
| `loyalcard-story-ro.html` | Versione rumena, verticale 9:16 per Instagram Stories (stage 720×1280), 46 s |
| `loyalcard-story-ro.mp4` | Export della versione rumena: 1080×1920, 30 fps, H.264, traccia audio muta |
| `render.mjs` | Script Playwright che cattura i fotogrammi della versione verticale |

Le pagine si aprono direttamente nel browser: hanno play/pausa, barra di avanzamento e capitoli.
Ogni animazione è una Web Animation in pausa su un unico orologio (`window.__lc.seek(t)`), quindi ogni fotogramma è deterministico.

## Rigenerare l'MP4

Serve Node con `playwright` (e Chromium) più `ffmpeg`.

```bash
node render.mjs loyalcard-story-ro.html frames video 30
ffmpeg -framerate 30 -i frames/f%05d.png \
  -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 \
  -map 0:v -map 1:a -c:v libx264 -profile:v high -level 4.1 -preset slow -crf 18 \
  -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k -shortest -movflags +faststart \
  loyalcard-story-ro.mp4
```

Per un controllo veloce di alcuni fotogrammi: `TIMES=4.2,19.2,28 node render.mjs loyalcard-story-ro.html check sheet`.
