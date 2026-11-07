// Royal Smash 3D - Exact Play Store Levels (Pedestal Table, Can Pyramids & Heart Shapes)
// Faithfully matches screen_0.jpg, screen_1.jpg, screen_2.jpg

class LevelBuilder {
    constructor() {
        this.materials = {};
        this.initMaterials();
    }

    initMaterials() {
        const tex = window.Textures;

        this.materials = {
            // Iconic Blue Wave Can (screen_0.jpg)
            waveCan: new THREE.MeshPhongMaterial({
                map: tex ? tex.createWaveCanTexture() : null,
                specular: 0xffffff,
                shininess: 90
            }),

            // Golden Crown Block (screen_2.jpg)
            goldCrownBlock: new THREE.MeshPhongMaterial({
                map: tex ? tex.createGoldenCrownBlockTexture() : null,
                specular: 0xfffae5,
                shininess: 120
            }),

            // Red Jam Jar (screen_1.jpg & screen_2.jpg)
            redJarBody: new THREE.MeshPhongMaterial({
                color: 0xdc2626,
                specular: 0xfca5a5,
                shininess: 120
            }),
            redLid: new THREE.MeshPhongMaterial({
                map: tex ? tex.createStripedLidTexture('#ef4444') : null,
                specular: 0xffffff,
                shininess: 70
            }),

            // Colorful Jam/Paint Jars (screen_1.jpg)
            yellowJarBody: new THREE.MeshPhongMaterial({ color: 0xfacc15, specular: 0xfef08a, shininess: 120 }),
            yellowLid: new THREE.MeshPhongMaterial({ map: tex ? tex.createStripedLidTexture('#f59e0b') : null, specular: 0xffffff, shininess: 70 }),

            blueJarBody: new THREE.MeshPhongMaterial({ color: 0x0284c7, specular: 0x7dd3fc, shininess: 120 }),
            blueLid: new THREE.MeshPhongMaterial({ map: tex ? tex.createStripedLidTexture('#0284c7') : null, specular: 0xffffff, shininess: 70 }),

            magentaJarBody: new THREE.MeshPhongMaterial({ color: 0xd946ef, specular: 0xf5d0fe, shininess: 120 }),
            magentaLid: new THREE.MeshPhongMaterial({ map: tex ? tex.createStripedLidTexture('#c026d3') : null, specular: 0xffffff, shininess: 70 }),

            orangeJarBody: new THREE.MeshPhongMaterial({ color: 0xf97316, specular: 0xfed7aa, shininess: 120 }),
            orangeLid: new THREE.MeshPhongMaterial({ map: tex ? tex.createStripedLidTexture('#ea580c') : null, specular: 0xffffff, shininess: 70 }),

            // TNT
            tnt: new THREE.MeshPhongMaterial({
                map: tex ? tex.createTNTTexture() : null,
                specular: 0xffffff,
                shininess: 60
            }),

            // Pedestal Stand Materials (screen_0.jpg)
            purpleTray: new THREE.MeshPhongMaterial({
                color: 0x8b2fc9,
                specular: 0xd8b4fe,
                shininess: 100
            }),
            goldStand: new THREE.MeshPhongMaterial({
                color: 0xfacc15,
                specular: 0xfef08a,
                shininess: 150
            })
        };
    }

    addEdgeOutline(mesh, geo, edgeColor = 0xffffff) {
        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: edgeColor,
            linewidth: 2,
            transparent: true,
            opacity: 0.6
        }));
        mesh.add(line);
    }

    // 1. Build Elevated Pedestal Table (Exact match to screen_0.jpg, screen_1.jpg, screen_2.jpg)
    buildPedestalTable(scene) {
        const group = new THREE.Group();

        // Round Base on Dirt Mound
        const baseGeo = new THREE.CylinderGeometry(1.6, 2.0, 0.6, 32);
        const baseMesh = new THREE.Mesh(baseGeo, this.materials.goldStand);
        baseMesh.position.y = 0.3;
        group.add(baseMesh);

        // Purple Base Rim
        const baseRimGeo = new THREE.TorusGeometry(1.9, 0.15, 12, 32);
        const baseRim = new THREE.Mesh(baseRimGeo, this.materials.purpleTray);
        baseRim.rotation.x = Math.PI / 2;
        baseRim.position.y = 0.3;
        group.add(baseRim);

        // Tall Gold Column Stem
        const stemGeo = new THREE.CylinderGeometry(0.38, 0.48, 3.4, 24);
        const stemMesh = new THREE.Mesh(stemGeo, this.materials.goldStand);
        stemMesh.position.y = 2.15;
        group.add(stemMesh);

        // Horizontal Purple Shelf / Tray (holds the targets!)
        const trayGeo = new THREE.BoxGeometry(8.2, 0.35, 2.8);
        const trayMesh = new THREE.Mesh(trayGeo, this.materials.purpleTray);
        trayMesh.position.y = 3.95;
        trayMesh.castShadow = true;
        trayMesh.receiveShadow = true;
        group.add(trayMesh);

        // Golden Trim Rim around the tray
        const rimGeo = new THREE.BoxGeometry(8.4, 0.15, 3.0);
        const rimMesh = new THREE.Mesh(rimGeo, this.materials.goldStand);
        rimMesh.position.y = 4.15;
        group.add(rimMesh);

        scene.add(group);

        // Static Physics Body for the Shelf (mass = 0)
        const trayShape = new CANNON.Box(new CANNON.Vec3(4.1, 0.175, 1.4));
        const trayBody = new CANNON.Body({
            mass: 0,
            material: window.Physics.groundMaterial,
            position: new CANNON.Vec3(0, 3.95, 0)
        });
        trayBody.addShape(trayShape);
        window.Physics.addPair(trayBody, group, false);
    }

    // 2. Add Blue Wave Can (screen_0.jpg)
    addWaveCan(scene, x, y, z) {
        const geo = new THREE.CylinderGeometry(0.44, 0.44, 1.15, 20);
        const mesh = new THREE.Mesh(geo, this.materials.waveCan);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        // Rotated vertical cylinder collider along Y-axis
        const shape = new CANNON.Cylinder(0.44, 0.44, 1.15, 12);
        const q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);

        const body = new CANNON.Body({
            mass: 1.5,
            material: window.Physics.blockMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape, new CANNON.Vec3(0, 0, 0), q);

        window.Physics.addPair(body, mesh, true, { type: 'can', points: 20 });
        return { mesh, body };
    }

    // 3. Add Jam / Paint Jar with Striped Lid (screen_1.jpg & screen_2.jpg)
    addJamJar(scene, x, y, z, color = 'red') {
        const group = new THREE.Group();

        const bodyMat = this.materials[`${color}JarBody`] || this.materials.redJarBody;
        const lidMat = this.materials[`${color}Lid`] || this.materials.redLid;

        // Glass Jar Body
        const jarGeo = new THREE.CylinderGeometry(0.44, 0.48, 0.9, 18);
        const jarMesh = new THREE.Mesh(jarGeo, bodyMat);
        jarMesh.castShadow = true;
        group.add(jarMesh);

        // Candy-Striped Lid
        const lidGeo = new THREE.CylinderGeometry(0.50, 0.50, 0.22, 18);
        const lidMesh = new THREE.Mesh(lidGeo, lidMat);
        lidMesh.position.y = 0.52;
        group.add(lidMesh);

        scene.add(group);

        const shape = new CANNON.Cylinder(0.48, 0.48, 1.1, 12);
        const q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);

        const body = new CANNON.Body({
            mass: 1.6,
            material: window.Physics.jarMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape, new CANNON.Vec3(0, 0, 0), q);

        // Shatter collision listener: triggers massive paint splatter!
        body.addEventListener('collide', (e) => {
            if (body.hasShattered) return;
            const impactVelocity = e.contact.getImpactVelocityAlongNormal();
            if (impactVelocity > 2.2) {
                body.hasShattered = true;
                if (window.Sound) window.Sound.playShatter();
                if (window.Sound) window.Sound.playCoin();
                if (window.Game) {
                    window.Game.addCoins(30, body.position);
                    window.Game.spawnColorSplatter(body.position, color);
                }
            }
        });

        window.Physics.addPair(body, group, true, { type: 'jar', points: 30, color });
        return { mesh: group, body };
    }

    // 4. Add Golden Crown Block (screen_2.jpg)
    addGoldCrownBlock(scene, x, y, z, size = 1.0) {
        const geo = new THREE.BoxGeometry(size, size, size);
        const mesh = new THREE.Mesh(geo, this.materials.goldCrownBlock);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.addEdgeOutline(mesh, geo, 0xffffff);
        scene.add(mesh);

        const half = size / 2;
        const shape = new CANNON.Box(new CANNON.Vec3(half, half, half));
        const body = new CANNON.Body({
            mass: 2.0,
            material: window.Physics.blockMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape);

        window.Physics.addPair(body, mesh, true, { type: 'gold', points: 25 });
        return { mesh, body };
    }

    // 5. Add TNT Barrel
    addTNT(scene, x, y, z) {
        const geo = new THREE.CylinderGeometry(0.62, 0.62, 1.3, 20);
        const mesh = new THREE.Mesh(geo, this.materials.tnt);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.addEdgeOutline(mesh, geo, 0xfacc15);
        scene.add(mesh);

        const shape = new CANNON.Cylinder(0.62, 0.62, 1.3, 12);
        const q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);

        const body = new CANNON.Body({
            mass: 2.4,
            material: window.Physics.tntMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape, new CANNON.Vec3(0, 0, 0), q);

        body.addEventListener('collide', (e) => {
            if (body.hasExploded) return;
            const impactVelocity = e.contact.getImpactVelocityAlongNormal();
            if (impactVelocity > 2.8 || (e.target.gameMeta && e.target.gameMeta.isCannonBall)) {
                body.hasExploded = true;
                setTimeout(() => {
                    window.Physics.explode(body.position, 7.5, 130);
                    window.Physics.removeBody(body, mesh);
                }, 30);
            }
        });

        window.Physics.addPair(body, mesh, true, { type: 'tnt', points: 40 });
        return { mesh, body };
    }

    loadLevel(levelIndex, scene) {
        window.Physics.clear();
        this.buildPedestalTable(scene);

        switch (levelIndex) {
            case 1: return this.buildLevel1(scene);
            case 2: return this.buildLevel2(scene);
            case 3: return this.buildLevel3(scene);
            case 4: return this.buildLevel4(scene);
            default: return this.buildLevel1(scene);
        }
    }

    // LEVEL 1: The Iconic Blue Wave Can Pyramid (EXACT MATCH TO screen_0.jpg!)
    buildLevel1(scene) {
        const canWidth = 0.95;
        const canHeight = 1.20;
        const baseY = 4.75; // Sits right on the purple tray

        // 7 Rows forming a perfect pyramid (1+2+3+4+5+6+7 = 28 cans)
        const rowCounts = [7, 6, 5, 4, 3, 2, 1];

        rowCounts.forEach((count, rowIndex) => {
            const startX = -((count - 1) * canWidth) / 2;
            const curY = baseY + rowIndex * canHeight;

            for (let i = 0; i < count; i++) {
                const x = startX + i * canWidth;
                this.addWaveCan(scene, x, curY, 0);
            }
        });

        return {
            name: "Classic Can Pyramid",
            ammo: 4,
            tip: "Aim for the lower rows to bring the whole pyramid tumbling down!"
        };
    }

    // LEVEL 2: The Heart Shape (Golden Crown Blocks + Red Jam Jars - EXACT MATCH TO screen_2.jpg!)
    buildLevel2(scene) {
        const blockSize = 0.85;
        const baseY = 4.60;

        // 8x8 Heart pattern matrix: 1 = Gold Block, 2 = Red Jam Jar
        const grid = [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 2, 2, 1, 1, 2, 2, 1],
            [1, 2, 2, 2, 2, 2, 2, 1],
            [1, 2, 2, 2, 2, 2, 2, 1],
            [1, 1, 2, 2, 2, 2, 1, 1],
            [1, 1, 1, 2, 2, 1, 1, 1],
            [1, 1, 1, 1, 2, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1]
        ];

        for (let r = 0; r < 8; r++) {
            const curY = baseY + (7 - r) * blockSize;
            for (let c = 0; c < 8; c++) {
                const curX = (c - 3.5) * blockSize;
                const val = grid[r][c];
                if (val === 1) {
                    this.addGoldCrownBlock(scene, curX, curY, 0, blockSize);
                } else if (val === 2) {
                    this.addJamJar(scene, curX, curY, 0, 'red');
                }
            }
        }

        return {
            name: "The Royal Heart",
            ammo: 4,
            tip: "Target the center red jars to trigger a satisfying glass-shattering cascade!"
        };
    }

    // LEVEL 3: Rainbow Paint Jars & Splatters (EXACT MATCH TO screen_1.jpg!)
    buildLevel3(scene) {
        const colors = ['red', 'orange', 'yellow', 'blue', 'magenta'];
        const baseY = 4.70;

        // 5 columns of colorful stacked jars
        for (let col = -2; col <= 2; col++) {
            const x = col * 1.1;
            for (let row = 0; row < 5; row++) {
                const y = baseY + row * 1.15;
                const color = colors[(Math.abs(col) + row) % colors.length];
                this.addJamJar(scene, x, y, 0, color);
            }
        }

        return {
            name: "Color Splatter Mania",
            ammo: 4,
            tip: "Hit the jars to trigger huge colorful paint splatters everywhere!"
        };
    }

    // LEVEL 4: TNT Fortress on the Shelf
    buildLevel4(scene) {
        // Base of Blue Wave Cans
        [-2.7, -1.8, -0.9, 0, 0.9, 1.8, 2.7].forEach(x => {
            this.addWaveCan(scene, x, 4.75, 0);
        });

        // Tier 2: TNT barrels on the sides
        this.addTNT(scene, -1.8, 6.0, 0);
        this.addJamJar(scene, -0.9, 6.0, 0, 'magenta');
        this.addJamJar(scene, 0, 6.0, 0, 'yellow');
        this.addJamJar(scene, 0.9, 6.0, 0, 'blue');
        this.addTNT(scene, 1.8, 6.0, 0);

        // Top Tier: Golden Crown blocks
        this.addGoldCrownBlock(scene, -0.9, 7.25, 0, 0.9);
        this.addGoldCrownBlock(scene, 0, 7.25, 0, 0.9);
        this.addGoldCrownBlock(scene, 0.9, 7.25, 0, 0.9);
        this.addJamJar(scene, 0, 8.4, 0, 'red');

        return {
            name: "TNT Barrel Fortress",
            ammo: 4,
            tip: "Strike either TNT barrel to blast all the cans off the shelf!"
        };
    }
}

window.Levels = new LevelBuilder();
