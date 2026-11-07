// Royal Smash 3D - Main Game Engine
// Manages Three.js rendering loop, state, economy, particles, UI, and level lifecycle

class GameEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cannon = null;

        // Economy & Inventory
        this.coins = parseInt(localStorage.getItem('royal_smash_coins') || '150', 10);
        this.equippedCannon = localStorage.getItem('royal_smash_cannon') || 'standard';
        this.unlockedCannons = JSON.parse(localStorage.getItem('royal_smash_unlocked') || '["standard"]');
        this.powerLevel = parseInt(localStorage.getItem('royal_smash_power_lvl') || '1', 10);
        this.ammoBonus = parseInt(localStorage.getItem('royal_smash_ammo_lvl') || '0', 10);

        // Level State
        this.currentLevel = 1;
        this.maxLevel = 6;
        this.ammo = 4;
        this.totalAmmo = 4;
        this.score = 0;
        this.totalDestructibles = 0;
        this.destroyedCount = 0;
        this.levelCompleted = false;
        this.levelFailed = false;
        this.isFiringBlocked = false;

        // Particle System
        this.particles = [];

        // Interaction State
        this.isAiming = false;
        this.pointerStart = { x: 0, y: 0 };
        this.currentPitch = 0.22;
        this.currentYaw = 0.0;

        this.init();
    }

    init() {
        const container = document.getElementById('canvas-container');

        // 1. Scene & Camera
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);

        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 150);
        this.camera.position.set(0, 5.5, 18.5);
        this.camera.lookAt(0, 2.5, 0);

        // 2. Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // 3. Lighting
        this.setupLights();

        // 4. Surroundings (Castle Walls & Mountains)
        this.setupEnvironment();

        // 5. Cannon Controller
        this.cannon = new CannonController(this.scene);

        // 6. Bind Events
        this.bindEvents();

        // 7. Start Level 1
        this.loadLevel(this.currentLevel);

        // 8. Render Loop
        this.lastTime = performance.now();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);

        this.updateHUD();
    }

    setupLights() {
        // Sunlight with soft shadows
        const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
        sunLight.position.set(12, 22, 14);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 60;
        sunLight.shadow.camera.left = -14;
        sunLight.shadow.camera.right = 14;
        sunLight.shadow.camera.top = 16;
        sunLight.shadow.camera.bottom = -8;
        sunLight.shadow.bias = -0.0005;
        this.scene.add(sunLight);

        // Sky / Ground Ambient Fill
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x445544, 0.65);
        this.scene.add(hemiLight);
    }

    setupEnvironment() {
        // Distant Hills / Royal Courtyard Ground
        const groundGeo = new THREE.PlaneGeometry(120, 120);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x567d46, roughness: 0.95 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.55;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Castle Wall in Background
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x7a838f, roughness: 0.9 });
        const wallGeo = new THREE.BoxGeometry(40, 8, 2.5);
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(0, 3.5, -14);
        wall.receiveShadow = true;
        wall.castShadow = true;
        this.scene.add(wall);

        // Castle Battlements (Crenels)
        for (let i = -18; i <= 18; i += 3) {
            const crenel = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 2.7), wallMat);
            crenel.position.set(i, 8.2, -14);
            crenel.castShadow = true;
            this.scene.add(crenel);
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        const canvas = this.renderer.domElement;

        // Pointer Aiming Controls
        const onDown = (clientX, clientY) => {
            if (this.levelCompleted || this.levelFailed || this.ammo <= 0) return;
            this.isAiming = true;
            this.pointerStart = { x: clientX, y: clientY };
            if (window.Sound) window.Sound.resume();
        };

        const onMove = (clientX, clientY) => {
            if (!this.isAiming) return;
            const dx = (clientX - this.pointerStart.x) / window.innerWidth;
            const dy = (clientY - this.pointerStart.y) / window.innerHeight;

            // Map mouse drag to yaw and pitch
            const targetYaw = -dx * 1.5;
            const targetPitch = 0.22 - dy * 0.9;
            this.cannon.setAim(targetPitch, targetYaw);
        };

        const onUp = () => {
            if (this.isAiming) {
                this.isAiming = false;
                this.shoot();
            }
        };

        canvas.addEventListener('mousedown', (e) => onDown(e.clientX, e.clientY));
        window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', onUp);

        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) onDown(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) onMove(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        window.addEventListener('touchend', onUp);
    }

    shoot() {
        if (this.ammo <= 0 || this.levelCompleted || this.levelFailed || this.isFiringBlocked) return;

        this.ammo--;
        this.updateHUD();

        const powerMult = 1.0 + (this.powerLevel - 1) * 0.12;
        this.cannon.fire(this.equippedCannon, powerMult);

        // Briefly throttle rapid spam
        this.isFiringBlocked = true;
        setTimeout(() => {
            this.isFiringBlocked = false;
        }, 350);

        // Check level outcome after delay
        setTimeout(() => {
            this.checkLevelOutcome();
        }, 2200);
    }

    loadLevel(lvl) {
        this.currentLevel = lvl;
        this.levelCompleted = false;
        this.levelFailed = false;

        // Hide modals
        document.getElementById('win-modal').classList.add('hidden');
        document.getElementById('lose-modal').classList.add('hidden');

        // Build Level with bonus ammo from upgrades
        const cfg = window.Levels.loadLevel(lvl, this.scene);
        this.totalAmmo = cfg.ammo + this.ammoBonus;
        this.ammo = this.totalAmmo;
        this.totalDestructibles = window.Physics.destructibleBodies.length;
        this.destroyedCount = 0;

        document.getElementById('level-name').innerText = `Level ${lvl}: ${cfg.name}`;
        document.getElementById('level-tip').innerText = cfg.tip || "";

        this.updateHUD();
    }

    checkLevelOutcome() {
        if (this.levelCompleted || this.levelFailed) return;

        const percent = Math.min(Math.round((this.destroyedCount / this.totalDestructibles) * 100), 100);

        // Win condition: >= 70% destruction
        if (percent >= 70) {
            this.triggerLevelWin(percent);
            return;
        }

        // Fail condition: out of ammo and under 70% after bodies settle
        if (this.ammo <= 0) {
            setTimeout(() => {
                const finalPercent = Math.min(Math.round((this.destroyedCount / this.totalDestructibles) * 100), 100);
                if (finalPercent >= 70) {
                    this.triggerLevelWin(finalPercent);
                } else {
                    this.triggerLevelLose(finalPercent);
                }
            }, 1800);
        }
    }

    triggerLevelWin(percent) {
        if (this.levelCompleted) return;
        this.levelCompleted = true;

        if (window.Sound) window.Sound.playVictory();

        // Calculate stars
        let stars = 1;
        if (this.ammo >= 2) stars = 3;
        else if (this.ammo >= 1) stars = 2;

        const bonusCoins = 100 + (stars * 25);
        this.addCoins(bonusCoins, new THREE.Vector3(0, 3, 0));

        // Show win modal
        const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        document.getElementById('win-stars').innerText = starStr;
        document.getElementById('win-percent').innerText = `${percent}% Destroyed!`;
        document.getElementById('win-reward').innerText = `+${bonusCoins} Gold Coins`;
        document.getElementById('win-modal').classList.remove('hidden');

        this.spawnConfetti();
    }

    triggerLevelLose(percent) {
        if (this.levelFailed || this.levelCompleted) return;
        this.levelFailed = true;

        if (window.Sound) window.Sound.playDefeat();

        document.getElementById('lose-percent').innerText = `${percent}% / 70% Needed`;
        document.getElementById('lose-modal').classList.remove('hidden');
    }

    addCoins(amt, worldPos) {
        this.coins += amt;
        localStorage.setItem('royal_smash_coins', this.coins.toString());
        this.updateHUD();

        // Floating Coin notification
        this.showFloatingText(`+${amt} Coins!`, worldPos);
    }

    showFloatingText(text, worldPos) {
        const floatEl = document.createElement('div');
        floatEl.className = 'floating-coin';
        floatEl.innerText = text;

        // Convert 3D position to Screen Coordinates
        const p = worldPos.clone().project(this.camera);
        const x = (p.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(p.y * 0.5) + 0.5) * window.innerHeight;

        floatEl.style.left = `${x}px`;
        floatEl.style.top = `${y}px`;
        document.body.appendChild(floatEl);

        setTimeout(() => floatEl.remove(), 1200);
    }

    updateHUD() {
        document.getElementById('coin-display').innerText = this.coins.toLocaleString();
        document.getElementById('ammo-display').innerText = `${this.ammo} / ${this.totalAmmo}`;

        const percent = this.totalDestructibles > 0 
            ? Math.min(Math.round((this.destroyedCount / this.totalDestructibles) * 100), 100) 
            : 0;
        document.getElementById('percent-display').innerText = `${percent}%`;
        document.getElementById('progress-fill').style.width = `${percent}%`;

        // Equipped cannon label
        const names = {
            standard: "Royal Brass Cannon",
            dragon: "Golden Dragon Cannon",
            inferno: "Inferno Cannon",
            bouncy: "Jester's Bouncy Cannon",
            triple: "Triple Cannon"
        };
        document.getElementById('active-cannon-name').innerText = names[this.equippedCannon] || "Cannon";
    }

    // Particle Burst Effects
    spawnSmokeBurst(pos) {
        for (let i = 0; i < 8; i++) {
            const geo = new THREE.SphereGeometry(0.25 + Math.random() * 0.2, 8, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.8 });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(pos);
            this.scene.add(p);

            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2 + 1,
                (Math.random() - 0.5) * 2 - 2
            );

            this.particles.push({ mesh: p, vel, life: 0.45, maxLife: 0.45 });
        }
    }

    spawnExplosionFX(pos) {
        // Fire sphere
        const flashGeo = new THREE.SphereGeometry(2.5, 12, 12);
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.copy(pos);
        this.scene.add(flash);
        this.particles.push({ mesh: flash, vel: new THREE.Vector3(0, 0, 0), life: 0.2, maxLife: 0.2, isFlash: true });

        // Smoke and spark particles
        for (let i = 0; i < 20; i++) {
            const size = 0.35 + Math.random() * 0.4;
            const isSpark = Math.random() > 0.4;
            const geo = new THREE.SphereGeometry(size, 8, 8);
            const mat = new THREE.MeshBasicMaterial({
                color: isSpark ? 0xffcc00 : 0x444444,
                transparent: true,
                opacity: 0.85
            });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(pos);
            this.scene.add(p);

            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                Math.random() * 7 + 2,
                (Math.random() - 0.5) * 8
            );

            this.particles.push({ mesh: p, vel, life: 0.7, maxLife: 0.7 });
        }
    }

    spawnConfetti() {
        const colors = [0xff0055, 0x00ffcc, 0xffd700, 0x7700ff, 0xff8800];
        for (let i = 0; i < 70; i++) {
            const geo = new THREE.PlaneGeometry(0.35, 0.2);
            const mat = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                side: THREE.DoubleSide
            });
            const p = new THREE.Mesh(geo, mat);
            p.position.set((Math.random() - 0.5) * 12, 8 + Math.random() * 4, 3 + (Math.random() - 0.5) * 6);
            this.scene.add(p);

            const vel = new THREE.Vector3((Math.random() - 0.5) * 3, -Math.random() * 3 - 1, (Math.random() - 0.5) * 3);
            this.particles.push({ mesh: p, vel, life: 2.2, maxLife: 2.2, isConfetti: true });
        }
    }

    animate(now) {
        requestAnimationFrame(this.animate);
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        // Step Physics Simulation
        window.Physics.step(dt);

        // Update Cannon recoil and trajectory
        this.cannon.update(dt);

        // Track Destructible Collapses
        this.trackDestructions();

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            } else {
                p.mesh.position.addScaledVector(p.vel, dt);
                if (p.isFlash) {
                    p.mesh.scale.multiplyScalar(1.08);
                    p.mesh.material.opacity = p.life / p.maxLife;
                } else if (p.isConfetti) {
                    p.mesh.rotation.x += dt * 5;
                    p.mesh.rotation.y += dt * 4;
                } else {
                    p.mesh.material.opacity = p.life / p.maxLife;
                }
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    trackDestructions() {
        let destroyed = 0;
        for (let item of window.Physics.destructibleBodies) {
            if (!item.destroyed) {
                const dy = Math.abs(item.body.position.y - item.originalY);
                const pos = item.body.position;

                // Condition for destruction: fallen, tipped over, or blown off pedestal
                if (pos.y < 0.3 || dy > 1.2 || Math.abs(pos.x) > 7.5 || Math.abs(pos.z) > 7.5) {
                    item.destroyed = true;
                    this.score += item.points;
                    this.addCoins(item.points, pos);
                }
            }
            if (item.destroyed) destroyed++;
        }

        if (destroyed !== this.destroyedCount) {
            this.destroyedCount = destroyed;
            this.updateHUD();
            this.checkLevelOutcome();
        }
    }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
    window.Game = new GameEngine();
});
