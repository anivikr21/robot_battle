# ⚙️ Build-Your-Robot Battle (Turn-Based Arena)

A small browser game where you **build a custom battle robot** and fight CPU bots in a **turn-based arena**.

You pick your parts (chassis, weapon, wheels, battery), then battle using:

- **Attack** – standard damage  
- **Guard** – reduce incoming damage next hit  
- **Special** – weapon-specific, high-power move with extra effects  

Between battles you gain **XP**, level up, and spend upgrade points to make your robot stronger.  
Your **HP fully resets after each match**, so every battle starts fresh.

---

## 🕹 Features

- **Robot Builder**
  - Choose from multiple:
    - Chassis: Light / Balanced / Heavy  
    - Weapons: Spinner / Ram / Launcher  
    - Wheels: Omni / Standard / Tank  
    - Batteries: Light / Standard / High-Capacity  
  - Each part changes your **HP, Attack, Speed, Energy** and passive stats.

- **Turn-Based Combat**
  - Player and enemy take turns.
  - Actions each turn:
    - **Attack** – basic hit with crit and dodge chances
    - **Guard** – reduce damage of the next attack
    - **Special** – depends on your weapon:
      - Spinner: big damage, chance to **self-stun**
      - Ram: big damage, chance to **stun enemy**
      - Launcher: applies **burn** (damage over time)
  - **Status effects**:
    - **Burn** – HP loss at start of turn  
    - **Slow** – weaker dodge for a few turns  
    - **Stun** – lose your turn  

- **XP, Levels & Upgrades**
  - Win/lose/draw → you earn XP.
  - Level up → gain **upgrade points**.
  - Upgrade stats that **persist across battles**:
    - HP, Attack, Speed, Energy.

- **Difficulty Slider**
  - **Easy** – weaker enemy HP/damage, worse crit/dodge, less aggressive AI.  
  - **Normal** – balanced.  
  - **Hard** – buffed enemy stats, better crit/dodge, more aggressive AI.

- **Nice QoL Bits**
  - All text is white on a dark background.
  - HP bars & stat previews.
  - Battle log showing each action, crit, miss, and status effect.
  - Your HP automatically **resets to full** after each match.

---

## 📂 Project Structure

```text
robot-battle/
  ├─ index.html   # Main page & layout
  ├─ styles.css   # All visual styling (dark theme, white text)
  └─ game.js      # Game logic (stats, battle system, XP, difficulty, etc.)

##

Thanks for Playing!