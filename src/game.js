// Royal Smash 3D - Main Game Engine (Exact Play Store Replica)
// Faithfully implements camera framing, fairytale castle background, paint splatters, and turntable cannon

class GameEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cannon = null;

        // Exact Arcade Viewport matching screen_0.jpg
        this.camBasePos = new THREE.Vector3(0, 4.5, 15.2);
        this.shakeIntensity = 0;

        // Economy
        this.coins = parseInt(localStorage.getItem('royal_smash_coins') || '150', 10);
        this.equippedCannon = localStorage.getItem('royal_smash_cannon') || 'standard';
        this.unlockedCannons = JSON.parse(localStorage.getItem('royal_smash_unlocked') || '["standard"]');
        this.powerLevel = parseInt(localStorage.getItem('royal_smash_power_lvl') || '1', 10);
        this.ammoBonus = parseInt(localStorage.getItem('royal_smash_ammo_lvl') || '0', 10);

        // Level State
        this.currentLevel = 1;
        this.maxLevel = 4;
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
        this.scene.background = new THREE.Color(0x38bdf8); // Sky Cyan (screen_0.jpg)
        this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.007);

        this.camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 150);
        this.camera.position.copy(this.camBasePos);
        this.camera.lookAt(0, 5.8, 0);

        // 2. High-Performance WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // 3. Bright Royal Lighting
        this.setupLights();

        // 4. Fairytale Castle Background (screen_0.jpg)
        this.setupEnvironment();

        // 5. Play Store Turntable Cannon
        this.cannon = new CannonController(this.scene);

        // 6. Smooth Aiming Controls
        this.bindEvents();

        // 7. Load Level 1 (Can Pyramid)
        this.loadLevel(this.currentLevel);

        // 8. Animation Loop
        this.lastTime = performance.now();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);

        this.updateHUD();
    }

    setupLights() {
        // Crisp Sun Light
        const sunLight = new THREE.DirectionalLight(0xfffaed, 1.6);
        sunLight.position.set(12, 32, 18);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 70;
        sunLight.shadow.camera.left = -16;
        sunLight.shadow.camera.right = 16;
        sunLight.shadow.camera.top = 22;
        sunLight.shadow.camera.bottom = -8;
        sunLight.shadow.bias = -0.0003;
        this.scene.add(sunLight);

        // Ambient Fill
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0284c7, 0.95);
        this.scene.add(hemiLight);

        const ambLight = new THREE.AmbientLight(0xffffff, 0.55);
        this.scene.add(ambLight);
    }

    setupEnvironment() {
        // Bright Green Rolling Lawn
        const groundGeo = new THREE.PlaneGeometry(140, 140);
        const groundMat = new THREE.MeshPhongMaterial({ color: 0x4ade80, specular: 0x86efac, shininess: 20 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0.0;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Dirt Circular Mound under the pedestal (screen_0.jpg)
        const dirtGeo = new THREE.CircleGeometry(3.2, 32);
        const dirtMat = new THREE.MeshPhongMaterial({ color: 0xca8a04, roughness: 0.9 });
        const dirt = new THREE.Mesh(dirtGeo, dirtMat);
        dirt.rotation.x = -Math.PI / 2;
        dirt.position.set(0, 0.02, 0);
        dirt.receiveShadow = true;
        this.scene.add(dirt);

        // Winding Pathway towards castle
        const pathGeo = new THREE.PlaneGeometry(3.6, 26);
        const pathMat = new THREE.MeshPhongMaterial({ color: 0xfef08a, roughness: 0.9 });
        const path = new THREE.Mesh(pathGeo, pathMat);
        path.rotation.x = -Math.PI / 2;
        path.position.set(0, 0.03, -15);
        this.scene.add(path);

        // Fairytale Disney Castle in Background (screen_0.jpg)
        this.buildFairytaleCastle();
    }

    buildFairytaleCastle() {
        const castleGroup = new THREE.Group();
        castleGroup.position.set(0, 0, -28);

        const stoneMat = new THREE.MeshPhongMaterial({ color: 0xf1f5f9, specular: 0xffffff, shininess: 40 });
        const purpleRoofMat = new THREE.MeshPhongMaterial({ color: 0x8b2fc9, specular: 0xd8b4fe, shininess: 80 });
        const goldMat = new THREE.MeshPhongMaterial({ color: 0xfacc15, specular: 0xfef08a, shininess: 120 });

        // Main Center Keep
        const mainKeep = new THREE.Mesh(new THREE.BoxGeometry(8, 9, 5), stoneMat);
        mainKeep.position.y = 4.5;
        mainKeep.castShadow = true;
        castleGroup.add(mainKeep);

        // Center High Spire Tower
        const centerTower = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 11, 20), stoneMat);
        centerTower.position.set(0, 5.5, 0);
        castleGroup.add(centerTower);

        // Center Purple Roof Cone
        const centerRoof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 5, 20), purpleRoofMat);
        centerRoof.position.set(0, 13.5, 0);
        castleGroup.add(centerRoof);

        // Gold Spire Ball on top
        const goldSpire = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), goldMat);
        goldSpire.position.set(0, 16.2, 0);
        castleGroup.add(goldSpire);

        // Left & Right Spires
        [-5.5, 5.5].forEach(x => {
            const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 8, 16), stoneMat);
            tower.position.set(x, 4.0, 0);
            castleGroup.add(tower);

            const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.8, 16), purpleRoofMat);
            roof.position.set(x, 9.8, 0);
            castleGroup.add(roof);

            const ball = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), goldMat);
            ball.position.set(x, 11.8, 0);
            castleGroup.add(ball);
        });

        // Cartoon Rounded Trees on Hills (screen_0.jpg)
        [-15, -10, 10, 16].forEach((tx, i) => {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 3.5, 12), new THREE.MeshPhongMaterial({ color: 0x78350f }));
            trunk.position.set(tx, 1.75, -20 + i * 2);
            castleGroup.add(trunk);

            const leaves = new THREE.Mesh(new THREE.SphereGeometry(2.5, 14, 14), new THREE.MeshPhongMaterial({ color: 0x22c55e, specular: 0x86efac, shininess: 20 }));
            leaves.position.set(tx, 4.8, -20 + i * 2);
            castleGroup.add(leaves);
        });

        this.scene.add(castleGroup);
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        const canvas = this.renderer.domElement;

        // Smooth Continuous Aiming directly toward cursor/touch
        const updateAimFromPoint = (clientX, clientY) => {
            const nx = (clientX / window.innerWidth - 0.5) * 2; // -1 to 1
            const ny = 1.0 - (clientY / window.innerHeight);     // 0 (bottom) to 1 (top)

            const yaw = -nx * 0.45;
            const pitch = 0.08 + ny * 0.55;
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

        // Touch controls
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
        this.addCoins(bonusCoins, new THREE.Vector3(0, 5, 0));

        const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        document.getElementById('win-stars').innerText = starStr;
        document.getElementById('win-percent').innerText = `${percent}% Cleared!`;
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
    }

    // Fiery Jet Trail behind Ball (screen_1.jpg)
    spawnBallTrail(pos) {
        for (let i = 0; i < 2; i++) {
            const geo = new THREE.SphereGeometry(0.22, 8, 8);
            const mat = new THREE.MeshBasicMaterial({
                color: (i === 0) ? 0xfacc15 : 0xf97316,
                transparent: true,
                opacity: 0.85
            });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(pos);
            this.scene.add(p);

            this.particles.push({
                mesh: p,
                vel: new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4),
                life: 0.28,
                maxLife: 0.28,
                isFlame: true
            });
        }
    }

    // Juicy Colorful Paint/Liquid Splatter (screen_1.jpg!)
    spawnColorSplatter(pos, color = 'red') {
        const colorMap = {
            red: 0xdc2626,
            yellow: 0xfacc15,
            blue: 0x0284c7,
            magenta: 0xd946ef,
            orange: 0xf97316
        };
        const hex = colorMap[color] || 0xdc2626;

        for (let i = 0; i < 25; i++) {
            const radius = 0.15 + Math.random() * 0.25;
            const geo = new THREE.SphereGeometry(radius, 8, 8);
            const mat = new THREE.MeshPhongMaterial({ color: hex, specular: 0xffffff, shininess: 120 });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(pos);
            this.scene.add(p);

            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 8 + 2,
                (Math.random() - 0.5) * 10
            );

            this.particles.push({ mesh: p, vel, life: 0.7, maxLife: 0.7 });
        }
    }

    spawnMuzzleBlast(pos) {
        const ringGeo = new THREE.RingGeometry(0.4, 0.8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(pos);
        ring.lookAt(this.camera.position);
        this.scene.add(ring);
        this.particles.push({ mesh: ring, vel: new THREE.Vector3(0,0,0), life: 0.22, maxLife: 0.22, isRing: true });

        for (let i = 0; i < 14; i++) {
            const geo = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 8, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(pos);
            this.scene.add(p);

            const vel = new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 2 + 1, (Math.random() - 0.5) * 4 - 3);
            this.particles.push({ mesh: p, vel, life: 0.45, maxLife: 0.45 });
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
            p.position.set((Math.random() - 0.5) * 16, 12 + Math.random() * 4, 3 + (Math.random() - 0.5) * 6);
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
                this.spawnBallTrail(ball.body.position);
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
                } else if (p.isFlame) {
                    p.mesh.scale.multiplyScalar(0.92);
                    p.mesh.material.opacity = p.life / p.maxLife;
                } else if (p.isConfetti) {
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

    // Track targets knocked off the purple shelf (shelf is at y = 3.95)
    trackDestructions() {
        let destroyed = 0;
        for (let item of window.Physics.destructibleBodies) {
            if (!item.destroyed) {
                const pos = item.body.position;

                // Knocked off condition: fallen below shelf (y < 3.7) or blown off horizontally
                if (pos.y < 3.7 || Math.abs(pos.x) > 4.6 || Math.abs(pos.z) > 2.2) {
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
