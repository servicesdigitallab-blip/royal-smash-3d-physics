// Royal Smash 3D - Main Game Engine (Polished Cannon Framing & Smooth Aiming)

class GameEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cannon = null;

        // Clean Camera Framing: Cannon centered at bottom, looking up at target castle
        this.camBasePos = new THREE.Vector3(0, 5.2, 16.5);
        this.shakeIntensity = 0;

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

        this.particles = [];
        this.isAiming = false;

        this.init();
    }

    init() {
        const container = document.getElementById('canvas-container');

        // 1. Scene & Camera
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x38bdf8); // Vibrant Royal Sky Cyan
        this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.009);

        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 150);
        this.camera.position.copy(this.camBasePos);
        this.camera.lookAt(0, 2.2, 0);

        // 2. High-Performance WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // 3. Bright Royal Lighting
        this.setupLights();
        this.setupEnvironment();

        // 4. Cannon Controller
        this.cannon = new CannonController(this.scene);

        // 5. Controls
        this.bindEvents();

        // 6. Start Level 1
        this.loadLevel(this.currentLevel);

        // 7. Loop
        this.lastTime = performance.now();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);

        this.updateHUD();
    }

    setupLights() {
        // High-Vibrancy Crisp Sunlight
        const sunLight = new THREE.DirectionalLight(0xfffaed, 1.6);
        sunLight.position.set(15, 30, 18);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 70;
        sunLight.shadow.camera.left = -16;
        sunLight.shadow.camera.right = 16;
        sunLight.shadow.camera.top = 20;
        sunLight.shadow.camera.bottom = -10;
        sunLight.shadow.bias = -0.0003;
        this.scene.add(sunLight);

        // Ambient Fills for bright saturated colors
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0284c7, 0.95);
        this.scene.add(hemiLight);

        const ambLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambLight);
    }

    setupEnvironment() {
        // Courtyard Green Grass Lawn
        const groundGeo = new THREE.PlaneGeometry(130, 130);
        const groundMat = new THREE.MeshPhongMaterial({ color: 0x22c55e, specular: 0x86efac, shininess: 20 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.55;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Castle Wall
        const wallMat = new THREE.MeshPhongMaterial({ color: 0x64748b, specular: 0x94a3b8, shininess: 30 });
        const wall = new THREE.Mesh(new THREE.BoxGeometry(46, 10, 3), wallMat);
        wall.position.set(0, 4.5, -16);
        wall.receiveShadow = true;
        wall.castShadow = true;
        this.scene.add(wall);

        // Battlements
        for (let i = -22; i <= 22; i += 3.5) {
            const crenel = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.7, 3.2), wallMat);
            crenel.position.set(i, 10.2, -16);
            crenel.castShadow = true;
            this.scene.add(crenel);
        }

        // Royal Banners
        const flagColors = [0xef4444, 0x3b82f6, 0xfacc15];
        [-15, -7, 1, 9, 17].forEach((fx, idx) => {
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.5, 8), new THREE.MeshPhongMaterial({ color: 0x334155 }));
            pole.position.set(fx, 12, -16);
            this.scene.add(pole);

            const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshBasicMaterial({
                color: flagColors[idx % flagColors.length],
                side: THREE.DoubleSide
            }));
            banner.position.set(fx + 0.8, 13.5, -16);
            this.scene.add(banner);
        });
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        const canvas = this.renderer.domElement;

        // Smooth Continuous Aiming: Moving cursor/finger maps directly to aim angles
        const updateAimFromPoint = (clientX, clientY) => {
            const nx = (clientX / window.innerWidth - 0.5) * 2; // -1 to 1
            const ny = 1.0 - (clientY / window.innerHeight);     // 0 (bottom) to 1 (top)

            const yaw = -nx * 0.45;
            const pitch = 0.06 + ny * 0.45;
            this.cannon.setAim(pitch, yaw);
        };

        canvas.addEventListener('mousemove', (e) => {
            updateAimFromPoint(e.clientX, e.clientY);
        });

        canvas.addEventListener('mousedown', (e) => {
            if (this.levelCompleted || this.levelFailed || this.ammo <= 0) return;
            if (window.Sound) window.Sound.resume();
            this.isAiming = true;
            updateAimFromPoint(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', () => {
            if (this.isAiming) {
                this.isAiming = false;
                this.shoot();
            }
        });

        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                if (window.Sound) window.Sound.resume();
                this.isAiming = true;
                updateAimFromPoint(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                updateAimFromPoint(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            if (this.isAiming) {
                this.isAiming = false;
                this.shoot();
            }
        });
    }

    shoot() {
        if (this.ammo <= 0 || this.levelCompleted || this.levelFailed || this.isFiringBlocked) return;

        this.ammo--;
        this.updateHUD();

        const powerMult = 1.0 + (this.powerLevel - 1) * 0.12;
        this.cannon.fire(this.equippedCannon, powerMult);

        this.isFiringBlocked = true;
        setTimeout(() => { this.isFiringBlocked = false; }, 350);

        setTimeout(() => { this.checkLevelOutcome(); }, 2400);
    }

    triggerScreenShake(intensity = 0.35) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    loadLevel(lvl) {
        this.currentLevel = lvl;
        this.levelCompleted = false;
        this.levelFailed = false;

        document.getElementById('win-modal').classList.add('hidden');
        document.getElementById('lose-modal').classList.add('hidden');

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

        if (percent >= 70) {
            this.triggerLevelWin(percent);
            return;
        }

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

        let stars = 1;
        if (this.ammo >= 2) stars = 3;
        else if (this.ammo >= 1) stars = 2;

        const bonusCoins = 100 + (stars * 25);
        this.addCoins(bonusCoins, new THREE.Vector3(0, 3, 0));

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
        this.showFloatingText(`+${amt} 🪙`, worldPos);
    }

    showFloatingText(text, worldPos) {
        const floatEl = document.createElement('div');
        floatEl.className = 'floating-coin';
        floatEl.innerText = text;

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

        const names = {
            standard: "Royal Star Cannon",
            dragon: "Golden Dragon Cannon",
            inferno: "Inferno Cannon",
            bouncy: "Jester's Bouncy Cannon",
            triple: "Triple Cannon"
        };
        document.getElementById('active-cannon-name').innerText = names[this.equippedCannon] || "Cannon";
    }

    // Ball Flight Particle Trail
    spawnBallTrail(pos, cannonType) {
        const colors = (cannonType === 'dragon') ? [0xffd700, 0xfde047] :
                       (cannonType === 'inferno') ? [0xff3d00, 0xf97316] :
                       (cannonType === 'bouncy')  ? [0x00f0ff, 0x38bdf8] :
                       [0xfde047, 0x38bdf8, 0xffffff];

        const col = colors[Math.floor(Math.random() * colors.length)];
        const geo = new THREE.PlaneGeometry(0.25, 0.25);
        const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
        const p = new THREE.Mesh(geo, mat);
        p.position.copy(pos);
        p.rotation.z = Math.random() * Math.PI;
        this.scene.add(p);

        this.particles.push({
            mesh: p,
            vel: new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5),
            life: 0.35,
            maxLife: 0.35,
            isSparkle: true
        });
    }

    spawnMuzzleBlast(pos) {
        const ringGeo = new THREE.RingGeometry(0.35, 0.7, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(pos);
        ring.lookAt(this.camera.position);
        this.scene.add(ring);
        this.particles.push({ mesh: ring, vel: new THREE.Vector3(0,0,0), life: 0.22, maxLife: 0.22, isRing: true });

        for (let i = 0; i < 12; i++) {
            const geo = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 8, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(pos);
            this.scene.add(p);

            const vel = new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 2 + 1, (Math.random() - 0.5) * 4 - 3);
            this.particles.push({ mesh: p, vel, life: 0.5, maxLife: 0.5 });
        }
    }

    spawnExplosionFX(pos) {
        this.triggerScreenShake(0.7);

        const flash = new THREE.Mesh(
            new THREE.SphereGeometry(3.5, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.95 })
        );
        flash.position.copy(pos);
        this.scene.add(flash);
        this.particles.push({ mesh: flash, vel: new THREE.Vector3(0,0,0), life: 0.22, maxLife: 0.22, isFlash: true });

        for (let i = 0; i < 35; i++) {
            const size = 0.35 + Math.random() * 0.35;
            const isSpark = Math.random() > 0.35;
            const mat = new THREE.MeshBasicMaterial({
                color: isSpark ? 0xfacc15 : 0xdc2626,
                transparent: true,
                opacity: 0.9
            });
            const p = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 8), mat);
            p.position.copy(pos);
            this.scene.add(p);

            const vel = new THREE.Vector3((Math.random() - 0.5) * 12, Math.random() * 9 + 4, (Math.random() - 0.5) * 12);
            this.particles.push({ mesh: p, vel, life: 0.8, maxLife: 0.8 });
        }
    }

    spawnGoldSparkles(pos) {
        for (let i = 0; i < 20; i++) {
            const geo = new THREE.PlaneGeometry(0.3, 0.3);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide, transparent: true });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(pos);
            this.scene.add(p);

            const vel = new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 5 + 3, (Math.random() - 0.5) * 6);
            this.particles.push({ mesh: p, vel, life: 0.85, maxLife: 0.85, isConfetti: true });
        }
    }

    spawnConfetti() {
        const colors = [0xef4444, 0x3b82f6, 0xfacc15, 0x10b981, 0x8b5cf6, 0xff007f];
        for (let i = 0; i < 100; i++) {
            const geo = new THREE.PlaneGeometry(0.38, 0.24);
            const mat = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                side: THREE.DoubleSide
            });
            const p = new THREE.Mesh(geo, mat);
            p.position.set((Math.random() - 0.5) * 16, 10 + Math.random() * 4, 3 + (Math.random() - 0.5) * 6);
            this.scene.add(p);

            const vel = new THREE.Vector3((Math.random() - 0.5) * 3, -Math.random() * 3 - 1.5, (Math.random() - 0.5) * 3);
            this.particles.push({ mesh: p, vel, life: 2.8, maxLife: 2.8, isConfetti: true });
        }
    }

    animate(now) {
        requestAnimationFrame(this.animate);
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        window.Physics.step(dt);
        this.cannon.update(dt);

        for (let ball of window.Physics.activeBalls) {
            ball.trailTimer = (ball.trailTimer || 0) + dt;
            if (ball.trailTimer > 0.02) {
                ball.trailTimer = 0;
                this.spawnBallTrail(ball.body.position, ball.type);
            }
        }

        this.trackDestructions();

        if (this.shakeIntensity > 0) {
            this.shakeIntensity -= dt * 1.6;
            if (this.shakeIntensity < 0) this.shakeIntensity = 0;
            this.camera.position.x = this.camBasePos.x + (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.position.y = this.camBasePos.y + (Math.random() - 0.5) * this.shakeIntensity;
        } else {
            this.camera.position.copy(this.camBasePos);
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            } else {
                p.mesh.position.addScaledVector(p.vel, dt);
                if (p.isRing) {
                    p.mesh.scale.multiplyScalar(1.28);
                    p.mesh.material.opacity = p.life / p.maxLife;
                } else if (p.isFlash) {
                    p.mesh.scale.multiplyScalar(1.08);
                    p.mesh.material.opacity = p.life / p.maxLife;
                } else if (p.isConfetti || p.isSparkle) {
                    p.mesh.rotation.x += dt * 6;
                    p.mesh.rotation.y += dt * 5;
                    p.mesh.material.opacity = p.life / p.maxLife;
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

                if (pos.y < 0.35 || dy > 1.0 || Math.abs(pos.x) > 7.5 || Math.abs(pos.z) > 7.5) {
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

window.addEventListener('DOMContentLoaded', () => {
    window.Game = new GameEngine();
});
