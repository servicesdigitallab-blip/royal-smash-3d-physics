# 👑 Royal Smash 3D - Physics Cannon Destruction Game

An immersive 3D physics-based arcade and destruction puzzle game inspired by **Royal Smash**, built entirely from scratch with **Three.js**, **Cannon.js**, and the **Web Audio API**.

---

## 🎮 Gameplay & Features

* **3D Physics Simulation:** Powered by Cannon.js rigid body physics, simulating mass, gravity, restitution, dynamic friction, and structural stability.
* **Realistic Trajectory Aiming:** Real-time parabolic ballistic arc calculator predicting projectile trajectory.
* **Structural Weak Points & Chain Reactions:** Knock down load-bearing pillars, trigger cascading collapses, and clear fortress structures with precision shots.
* **Explosive TNT Barrels:** Impacting TNT triggers radial impulse shockwaves, blasting surrounding crates and masonry outward.
* **Fragile Golden Urns & Crowns:** High-value royal treasures that shatter into sparkling particles and award bonus gold.
* **5 Unique Royal Cannons ("Toop"):**
  1. **Royal Brass Cannon:** Balanced velocity and heavy iron shot.
  2. **Golden Dragon Cannon:** Massive gold cannonballs (+40% destruction impact!).
  3. **Inferno Cannon:** Exploding fireballs that detonate on impact with any surface.
  4. **Jester's Bouncy Cannon:** High-elasticity rubber rounds that ricochet behind barriers.
  5. **Triple Cannon:** Fires a spread of 3 cannonballs at once.
* **Royal Arsenal Shop & Economy:**
  * In-game Coin economy saved persistently in `localStorage`.
  * Velocity / Power upgrades.
  * Extra ammo capacity upgrades.
* **Synthesized Audio Engine:** 100% procedural Web Audio API sound effects—cannon booms, impacts, shattering glass, explosions, coin chimes, and victory fanfares without external audio dependencies.
* **6 Progressive Levels:**
  1. *The Royal Watchtower* (Tutorial & basics)
  2. *The Castle Gate* (Pillars & bridge destruction)
  3. *Jester's Pyramid* (Chain-reaction pyramid)
  4. *Iron Bastion* (Armored shields & curved shots)
  5. *King's Citadel* (Multi-tiered fortress)
  6. *The Imperial Palace* (Twin grand towers & skybridge)

---

## 🚀 How to Play

Simply double-click `index.html` in your web browser (Chrome, Edge, Firefox, Safari) or serve it locally.

### Controls:
* **Aim:** Click / Touch and Drag across the screen to adjust the cannon barrel's elevation and horizontal rotation.
* **Fire:** Release mouse or finger to launch the cannonball!
* **Shop / Upgrades:** Click the **Shop** button on the top right to spend your gold on new cannons and stats.
