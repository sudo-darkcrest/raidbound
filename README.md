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

  Each boss plays its own deck, has custom rules and changes phase as it weakens. Three difficulties: **Normal** to learn, **Heroic** for a real fight (against 2 or more heroes the boss strikes extra times), and **Mythic**, unlocked for each raid by beating it on Heroic: more boss health, an earlier Enrage at round 20, and a treasure pack where every card is a holofoil and two are raid treasures, plus 50% more gold. Each raid has its own treasure pack.
  - Each raid also has a small **Omen** deck. Omens come every boss turn with 3 or 4 heroes, every other turn with 2 and every third alone, and the next three wait face up beside the boss. **Soak** omens share their damage between the heroes who step into the circle.
  - Each raid has its own gauge: the Crypt's light sears the undead when you heal, Vorthrax takes to the air when his Embers fill (only Volley and Skyward cards can reach him until you shoot him down, and the ones that can glow), and you can bail water to hold back Nethys's Tide (it rises at most 2 in one boss turn, and every change shows in the log).
- **Defending together:** Bulwark allies can **cover** any friendly hero or ally (covering a teammate draws the boss's eye), and **React** cards answer an attack the moment it comes. Keywords: Bulwark, Swift, Volley, Skyward, Shrouded, Guardian, Ambush, Crushing, Frenzy, Thick Hide and Tend.
- **Menu bar:** every menu page (Dungeons, Raids, Play online, Market, Collection, The Vault, How to play, Settings), and the screen where you open a booster pack, has the same bar across the top, so you can jump straight to any other page without going back to the title. It stays put while you scroll.
- **Picking heroes:** the raid screen, the Dungeons screen and the online lobby show every hero as a picture. Hover over one to see its full hero card.
- **The Raider's Field Guide:** the How to play screen is a small illustrated book, and the Rules button in battle opens the chapters you need mid-fight.
- **Stories:** every raid and dungeon has its own two-part tale, shown in raid setup, on the Dungeons screen and in the Field Guide.
- **3 dungeons:**
  - Thornwood Hollow
  - Bloodfang Warcamp
  - The Runebound Vault

  Dungeons run themselves. Each one is a gauntlet: two under-bosses, then the master of the dungeon (Elder Gnarlroot, Gorrash Bloodfang or Thuldrak, the Runebound Warden), in one fight. Each turn the dungeon flips cards, marks a hero at random and attacks them, and it levels up each time an under-boss falls. There are four difficulties, from Novice to Legendary. Winning earns Dungeon XP, and each dungeon level lets more of your own cards into your starter deck.
- **Your collection:** you start with the cards for each starting hero's starter deck, plus two free Raidbound Core booster packs. Each hero you unlock brings the cards for their starter deck. Every hero can always play their Starter deck. The set buttons show how many cards of each set you have found (for example 41 / 60) with a progress bar, and a tick when the set is complete.
- **Market:**
  - Spend the gold you earn on Raidbound Core packs (three separate packs, each with its own wrapper: 5 cards for 75 gold, 10 for 150 or 20 for 275; core cards for every class), three themed booster sets (Emberfall, Frostwing and Voidshade, 35 cards each, 100 gold), single cards from a daily shop of eight, extra raid treasure and hero skins.
  - The Workshop turns spare cards into dust for crafting core and booster cards.
- **The Vault:** 49 cosmetics (21 card backs, six of them shimmering foil backs from loot cards; 16 table themes; 12 companions, each giving its hero one tiny bonus) and 20 hero skins. You earn them from raids, dungeons, packs and loot codes.
- **Party play:** up to four heroes share one device. The AI can run any seat, and bosses scale with party size. You can also play as the raid boss against AI heroes.
- **Online:** one player creates a party and shares a 5-letter code, and friends join from their own computer or phone.
  - **Party chat:** a Chat button in the lobby and during the fight opens quick phrases ("Heal me!", "Save your Instants"…) and a box to type in. A closed chat shows a red count and the newest line for a few seconds. You can mute any player, and someone who drops and rejoins sees the last 50 lines.
- **Turn chime:** a short chime plays when the turn passes to you, even when the game is in another browser tab (the tab's title flashes too). Switch it off in Settings.
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

`server/` holds a small Node relay for online play. It keeps lobbies and passes each player's moves to everyone in the same order. It also passes chat lines along (plain text, at most 200 letters, 6 lines in 8 seconds per player), kept apart from the moves. Every browser runs the same game from the same random seed, so the server never runs any game rules. To host it yourself:

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
