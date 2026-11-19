# gta6-trophy-guide-01-bot

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Akd170396/gta6-trophy-guide-01-bot/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Akd170396/gta6-trophy-guide-01-bot/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Platinum Atlas** — an offline, fan-made guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy carries its official name, description and grade plus an original guide that cites its sources (the official list via Exophase and PSNProfiles, tracked counts via PSNProfiles). It includes a checklist with progress saved in the browser (localStorage), counters for counted trophies, per-trophy notes, filters by kind/grade/status, search, a spoiler-free mode that hides story trophies until earned, export/import of progress, a six-stage roadmap to the platinum, a missables page (flags built from the official descriptions, basis stated in each guide), and a Next up planner. No Rockstar logos or artwork; the look is its own. Static files under `app/` — works with the network off.

## Run it

```sh
node serve.ts
# then open http://localhost:8080/

# Build the entry dossier (copies app/ + screenshots/ to out/ and writes out/dossier.json):
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

Entered on [make.fun](https://make.fun/?ref=s3svssng&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards
