# Raidbound

A high-fantasy raid card game for your browser. One to four heroes, each with their own deck, take on a raid boss that plays a deck of its own. Build your party, gear up with weapons and armour, complete quests, and bring the boss down for treasure. Play alone, with friends on one device, or online together. It works on computers, tablets and phones.

## Play

**https://raidbound.onrender.com**

Just open the link. The page starts small and loads pictures as they are needed. Your browser keeps them, so the next visit is faster. Your progress (gold, collection, decks, loot codes, cosmetics, dungeon level) is saved in that browser.

The single-file version, `public/Raidbound.html`, has every picture packed inside. Download it and double-click it to play with no internet connection.

## What's in the game

- **15 heroes**, across two factions: the Silver Concord and the Ember Clans.
  - Six are open from the start: Ser Aldric, Thorgrim, Lyssara, Grukka, Hruna and Snix.
  - Nine more unlock as you play.
  - Every hero has a once-per-game power. Their faction, race and class decide which cards their deck can hold.
- **308 cards:**
  - 86 allies, 91 abilities (basic and instant), 24 weapons, 26 armour pieces, 34 items, 17 quests, 15 locations and 15 Master Heroes (an Ascended version of each hero).
  - The rarest cards are Legendary.
  - Loot cards hide scratch-off codes that unlock cosmetics.
- **3 raids:**
  - Crypt of the Hollow King
  - The Molten Spire
  - The Sunken Cathedral

  Each boss plays its own deck, has custom rules and changes phase as it weakens. Heroic difficulty raises the stakes. Each raid has its own treasure pack.
- **3 dungeons:**
  - Thornwood Hollow
  - Bloodfang Warcamp
  - Vault of the Iron Sentinel

  Dungeons run themselves. Each turn the dungeon flips cards, marks a hero at random and attacks them, and levels up as you hurt it. There are four difficulties, from Novice to Legendary. Winning earns Dungeon XP, and each dungeon level lets more of your own cards into your starter deck.
- **Market:**
  - Spend the gold you earn on three booster sets (Emberfall, Frostwing and Voidshade, 35 cards each), single cards, extra raid treasure and hero skins.
  - The Workshop turns spare cards into dust for crafting.
- **The Vault:** 35 cosmetics (15 card backs, 13 table themes and 7 companion pets) and 18 hero skins. You earn them from raids, dungeons, packs and loot codes.
- **Party play:** up to four heroes share one device. The AI can run any seat, and bosses scale with party size. You can also play as the raid boss against AI heroes.
- **Online:** one player creates a party and shares a 5-letter code, and friends join from their own computer or phone.
  - Raids take up to 4 heroes and dungeons up to 3.
  - The host can fill empty seats with AI heroes.
  - If someone drops out, the AI plays their hero until they come back.
- **Phones and tablets:** the same game switches to a touch layout on small screens. Swipe through your hand and allies, tap a card to see it big, and open the party and raid log from a drawer. It works upright and sideways.

## Building from source

The game is plain JavaScript and CSS in `src/`. You need Python 3 (with Pillow) to bundle it:

```
python build.py             # optimises gen/*.webp, then writes dist/raidbound.html (single file) and dist/web/ (index.html + art/)
python ingest.py id=pic.png # adds a new painting for a card: crops it, saves gen/<id>.webp and rebuilds the art
node tools/sim.js 20        # optional: AI-vs-boss balance simulation (20 games per matchup)
```

The website is `dist/web/`, committed as `public/`. Render serves it as a static site.

### Online server

`server/` holds a small Node relay for online play. It keeps lobbies and passes each player's moves to everyone in the same order. Every browser runs the same game from the same random seed, so the server never runs any game rules. To host it yourself:

```
cd server && npm install
node server.js              # listens on $PORT (default 8080)
```

To point the game at your own server, set `RB.NET_URL` in `src/online.js`.

### Where things live

| File | What it does |
|---|---|
| `src/data.js` | Heroes, core cards, boss decks, raids and cosmetics |
| `src/frontier.js`, `src/packs.js`, `src/expansion.js` | Booster sets and the cards in them |
| `src/treasure.js`, `src/masters.js`, `src/skins.js` | Raid treasure, Ascended Master Heroes, hero skins |
| `src/dungeons.js` | Dungeons, difficulties, Dungeon XP and dungeon decks |
| `src/engine.js` | Rules engine (works in the browser and in Node) |
| `src/ai.js` | AI player, deck building and starter decks |
| `src/online.js` | Online lobby and lockstep sync |
| `src/ui_*.js`, `src/market.js`, `src/audio.js`, `src/style.css` | Screens, battle board, Market, treasure packs, sound and music, and the phone layout |
| `src/art_*.js` | Code-drawn art used as a fallback for any card without a painting |
| `gen/` | The master card, hero and raid paintings |
| `tools/optimize_art.py` | Shrinks the paintings for the game and gives them cache-safe file names |
| `gemini/` | The prompt kit used to paint new cards |
| `server/` | The online relay server |

## Credits

- **Card and scene paintings:** made with AI image tools (SpriteCook, Gemini, ChatGPT and Grok). Each one was checked by hand to keep out real-world logos and copyrighted designs.
- **Backdrop photos:** from [Unsplash](https://unsplash.com/?utm_source=raidbound&utm_medium=referral), used under the Unsplash License. Each photographer is credited on the game's *How to play* page and in `gen_photos.py`.
- **Fonts:** Grenze Gotisch, Alegreya and Alegreya SC, under the SIL Open Font License.
- Raidbound is an original setting. It is not affiliated with any existing game or franchise.
