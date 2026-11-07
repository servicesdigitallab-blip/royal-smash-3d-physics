// Royal Smash 3D - Vibrant Carnival & Castle Level Generator
// Features colorful toy blocks, carnival cans, domino beams, TNT barrels, and golden royal treasures

class LevelBuilder {
    constructor() {
        this.materials = {};
        this.initMaterials();
    }

    initMaterials() {
        const tex = window.Textures;

        this.materials = {
            // Colorful Glossy Toy Blocks
            blueBlock: new THREE.MeshStandardMaterial({
                map: tex ? tex.createToyBlockTexture('#2563eb', '#1d4ed8', 'star') : null,
                roughness: 0.25,
                metalness: 0.1
            }),
            redBlock: new THREE.MeshStandardMaterial({
                map: tex ? tex.createToyBlockTexture('#dc2626', '#991b1b', 'crown') : null,
                roughness: 0.25,
                metalness: 0.1
            }),
            yellowBlock: new THREE.MeshStandardMaterial({
                map: tex ? tex.createToyBlockTexture('#f59e0b', '#d97706', 'diamond') : null,
                roughness: 0.25,
                metalness: 0.1
            }),
            greenBlock: new THREE.MeshStandardMaterial({
                map: tex ? tex.createToyBlockTexture('#10b981', '#059669', 'wood') : null,
                roughness: 0.35,
                metalness: 0.05
            }),
            purpleBlock: new THREE.MeshStandardMaterial({
                map: tex ? tex.createToyBlockTexture('#8b5cf6', '#6d28d9', 'star') : null,
                roughness: 0.3,
                metalness: 0.1
            }),

            // Carnival Bowling / Knockdown Cans (with Bullseye)
            redCan: new THREE.MeshStandardMaterial({
                map: tex ? tex.createCanTexture('#dc2626') : null,
                roughness: 0.2,
                metalness: 0.2
            }),
            blueCan: new THREE.MeshStandardMaterial({
                map: tex ? tex.createCanTexture('#2563eb') : null,
                roughness: 0.2,
                metalness: 0.2
            }),

            // TNT Explosive Barrel
            tnt: new THREE.MeshStandardMaterial({
                map: tex ? tex.createTNTTexture() : null,
                roughness: 0.4,
                metalness: 0.1
            }),

            // Royal Pure Gold
            gold: new THREE.MeshStandardMaterial({
                color: 0xffd700,
                metalness: 0.9,
                roughness: 0.15
            }),

            // Royal Pedestal Platform (Checkerboard Court)
            pedestal: new THREE.MeshStandardMaterial({
                color: 0x1e293b,
                roughness: 0.7
            })
        };
    }

    // 1. Add Toy Cube (Varied sizes: small 0.8, medium 1.2, large 1.5)
    addToyCube(scene, x, y, z, size = 1.2, colorType = 'blue') {
        const mat = this.materials[colorType + 'Block'] || this.materials.blueBlock;
        const geo = new THREE.BoxGeometry(size, size, size);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        const half = size / 2;
        const shape = new CANNON.Box(new CANNON.Vec3(half, half, half));
        const body = new CANNON.Body({
            mass: size * 3.5,
            material: window.Physics.blockMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape);

        window.Physics.addPair(body, mesh, true, { type: colorType, points: 15 });
        return { mesh, body };
    }

    // 2. Add Carnival Soda / Knockdown Can
    addCarnivalCan(scene, x, y, z, color = 'red') {
        const mat = (color === 'red') ? this.materials.redCan : this.materials.blueCan;
        const geo = new THREE.CylinderGeometry(0.48, 0.48, 1.35, 20);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        const shape = new CANNON.Cylinder(0.48, 0.48, 1.35, 12);
        const body = new CANNON.Body({
            mass: 3.0,
            material: window.Physics.blockMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape);

        window.Physics.addPair(body, mesh, true, { type: 'can', points: 20 });
        return { mesh, body };
    }

    // 3. Add Domino / Bridge Beam
    addDominoBeam(scene, x, y, z, width = 3.6, height = 0.5, depth = 1.0, color = 'yellow') {
        const mat = this.materials[color + 'Block'] || this.materials.yellowBlock;
        const geo = new THREE.BoxGeometry(width, height, depth);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
        const body = new CANNON.Body({
            mass: width * 5.0,
            material: window.Physics.blockMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape);

        window.Physics.addPair(body, mesh, true, { type: 'beam', points: 25 });
        return { mesh, body };
    }

    // 4. Add Tall Pillar (Sutoon)
    addTallPillar(scene, x, y, z, height = 3.2, color = 'purple') {
        const mat = this.materials[color + 'Block'] || this.materials.purpleBlock;
        const geo = new THREE.BoxGeometry(0.9, height, 0.9);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        const shape = new CANNON.Box(new CANNON.Vec3(0.45, height / 2, 0.45));
        const body = new CANNON.Body({
            mass: height * 6.5,
            material: window.Physics.stoneMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape);

        window.Physics.addPair(body, mesh, true, { type: 'pillar', points: 30 });
        return { mesh, body };
    }

    // 5. Add Red TNT Barrel
    addTNT(scene, x, y, z) {
        const geo = new THREE.CylinderGeometry(0.68, 0.68, 1.35, 20);
        const mesh = new THREE.Mesh(geo, this.materials.tnt);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        const shape = new CANNON.Cylinder(0.68, 0.68, 1.35, 14);
        const body = new CANNON.Body({
            mass: 3.5,
            material: window.Physics.tntMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape);

        body.addEventListener('collide', (e) => {
            if (body.hasExploded) return;
            const impactVelocity = e.contact.getImpactVelocityAlongNormal();
            if (impactVelocity > 4.0 || (e.target.gameMeta && e.target.gameMeta.isCannonBall)) {
                body.hasExploded = true;
                setTimeout(() => {
                    window.Physics.explode(body.position, 6.5, 90);
                    window.Physics.removeBody(body, mesh);
                }, 35);
            }
        });

        window.Physics.addPair(body, mesh, true, { type: 'tnt', points: 40 });
        return { mesh, body };
    }

    // 6. Add Royal Golden Crown Urn
    addRoyalCrown(scene, x, y, z) {
        const group = new THREE.Group();

        // Golden Goblet body
        const cupGeo = new THREE.CylinderGeometry(0.4, 0.6, 1.0, 16);
        const cup = new THREE.Mesh(cupGeo, this.materials.gold);
        cup.castShadow = true;
        group.add(cup);

        // Ornate Crown on top
        const crownGeo = new THREE.ConeGeometry(0.45, 0.65, 8);
        const crown = new THREE.Mesh(crownGeo, this.materials.gold);
        crown.position.y = 0.65;
        crown.rotation.x = Math.PI;
        group.add(crown);
        scene.add(group);

        const shape = new CANNON.Cylinder(0.45, 0.6, 1.0, 10);
        const body = new CANNON.Body({
            mass: 2.2,
            material: window.Physics.jarMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape);

        body.addEventListener('collide', (e) => {
            if (body.hasShattered) return;
            const impactVelocity = e.contact.getImpactVelocityAlongNormal();
            if (impactVelocity > 3.0) {
                body.hasShattered = true;
                if (window.Sound) window.Sound.playShatter();
                if (window.Sound) window.Sound.playCoin();
                if (window.Game) {
                    window.Game.addCoins(50, body.position);
                    window.Game.spawnGoldSparkles(body.position);
                }
            }
        });

        window.Physics.addPair(body, group, true, { type: 'gold', points: 50 });
        return { mesh: group, body };
    }

    // Arena Pedestal Platform
    buildArenaPlatform(scene) {
        const pedGeo = new THREE.BoxGeometry(16, 1.0, 16);
        const platform = new THREE.Mesh(pedGeo, this.materials.pedestal);
        platform.position.set(0, -0.5, 0);
        platform.receiveShadow = true;
        scene.add(platform);

        // Golden rim border around pedestal
        const rimGeo = new THREE.BoxGeometry(16.4, 0.2, 16.4);
        const rim = new THREE.Mesh(rimGeo, this.materials.gold);
        rim.position.set(0, 0.05, 0);
        scene.add(rim);

        const groundShape = new CANNON.Box(new CANNON.Vec3(8, 0.5, 8));
        const groundBody = new CANNON.Body({
            mass: 0,
            material: window.Physics.groundMaterial,
            position: new CANNON.Vec3(0, -0.5, 0)
        });
        groundBody.addShape(groundShape);
        window.Physics.addPair(groundBody, platform, false);
    }

    loadLevel(levelIndex, scene) {
        window.Physics.clear();
        this.buildArenaPlatform(scene);

        switch (levelIndex) {
            case 1: return this.buildLevel1(scene);
            case 2: return this.buildLevel2(scene);
            case 3: return this.buildLevel3(scene);
            case 4: return this.buildLevel4(scene);
            case 5: return this.buildLevel5(scene);
            case 6: return this.buildLevel6(scene);
            default: return this.buildLevel1(scene);
        }
    }

    // LEVEL 1: Carnival Can Pyramid & Royal Crown
    buildLevel1(scene) {
        // Base of 4 Red/Blue Cans
        const canXs = [-1.5, -0.5, 0.5, 1.5];
        canXs.forEach((x, i) => {
            this.addCarnivalCan(scene, x, 0.7, 0, i % 2 === 0 ? 'red' : 'blue');
        });

        // Yellow Domino Beam
        this.addDominoBeam(scene, 0, 1.65, 0, 3.8, 0.45, 1.0, 'yellow');

        // Tier 2: 3 Toy Blocks
        this.addToyCube(scene, -1.0, 2.45, 0, 1.1, 'blue');
        this.addToyCube(scene, 0, 2.45, 0, 1.1, 'red');
        this.addToyCube(scene, 1.0, 2.45, 0, 1.1, 'blue');

        // Golden Crown on top
        this.addRoyalCrown(scene, 0, 3.75, 0);

        return {
            name: "Carnival Knockdown",
            ammo: 4,
            tip: "Hit the center beam or bottom cans to bring down the whole pyramid!"
        };
    }

    // LEVEL 2: The Castle Gate with Explosive Core
    buildLevel2(scene) {
        // Twin Tall Purple Pillars
        this.addTallPillar(scene, -1.8, 1.6, 0, 3.2, 'purple');
        this.addTallPillar(scene, 1.8, 1.6, 0, 3.2, 'purple');

        // Bridge Domino
        this.addDominoBeam(scene, 0, 3.45, 0, 4.4, 0.5, 1.0, 'green');

        // Red TNT barrel right in the middle!
        this.addTNT(scene, 0, 4.4, 0);

        // Golden Goblets on the pillars
        this.addRoyalCrown(scene, -1.6, 4.3, 0);
        this.addRoyalCrown(scene, 1.6, 4.3, 0);

        return {
            name: "The Royal Gate",
            ammo: 3,
            tip: "Aim right at the TNT barrel in the center for an explosive chain reaction!"
        };
    }

    // LEVEL 3: Jester's Multi-Color Pyramid
    buildLevel3(scene) {
        // 5 Cans at the bottom
        [-2.0, -1.0, 0, 1.0, 2.0].forEach((x, i) => {
            this.addCarnivalCan(scene, x, 0.7, 0, i % 2 === 0 ? 'red' : 'blue');
        });

        // Beam 1
        this.addDominoBeam(scene, 0, 1.65, 0, 4.8, 0.45, 1.0, 'yellow');

        // 4 Toy Blocks
        [-1.5, -0.5, 0.5, 1.5].forEach((x, i) => {
            this.addToyCube(scene, x, 2.4, 0, 1.0, i % 2 === 0 ? 'green' : 'red');
        });

        // Beam 2
        this.addDominoBeam(scene, 0, 3.15, 0, 3.6, 0.45, 1.0, 'yellow');

        // TNT in center of tier 3
        this.addToyCube(scene, -1.0, 3.9, 0, 1.0, 'blue');
        this.addTNT(scene, 0, 3.9, 0);
        this.addToyCube(scene, 1.0, 3.9, 0, 1.0, 'blue');

        // Top Crown
        this.addRoyalCrown(scene, 0, 5.2, 0);

        return {
            name: "Jester's Wonder Pyramid",
            ammo: 4,
            tip: "Hit the lower tier to trigger a cascading domino effect!"
        };
    }

    // LEVEL 4: Iron & Stone Fortress
    buildLevel4(scene) {
        // Front Shield Blocks
        this.addToyCube(scene, -1.6, 0.75, 1.4, 1.4, 'blue');
        this.addToyCube(scene, 1.6, 0.75, 1.4, 1.4, 'blue');

        // Twin Support Pillars
        this.addTallPillar(scene, -1.6, 1.6, 0, 3.2, 'purple');
        this.addTallPillar(scene, 1.6, 1.6, 0, 3.2, 'purple');

        // TNT Barrels placed right at the foundation
        this.addTNT(scene, 0, 0.7, 0);

        // Roof Beam & Top Urns
        this.addDominoBeam(scene, 0, 3.45, 0, 4.2, 0.5, 1.0, 'green');
        this.addRoyalCrown(scene, 0, 4.4, 0);
        this.addCarnivalCan(scene, -1.4, 4.4, 0, 'red');
        this.addCarnivalCan(scene, 1.4, 4.4, 0, 'blue');

        return {
            name: "The Royal Bastion",
            ammo: 4,
            tip: "Angle your shot above the blue shield blocks to strike the center TNT!"
        };
    }

    // LEVEL 5: King's Multi-Tier Citadel
    buildLevel5(scene) {
        // 4 Corner Pillars
        this.addTallPillar(scene, -2.0, 1.6, -1.0, 3.2, 'purple');
        this.addTallPillar(scene, 2.0, 1.6, -1.0, 3.2, 'purple');
        this.addTallPillar(scene, -2.0, 1.6, 1.0, 3.2, 'purple');
        this.addTallPillar(scene, 2.0, 1.6, 1.0, 3.2, 'purple');

        // Lower TNT Core
        this.addTNT(scene, 0, 0.7, 0);

        // Double Bridge
        this.addDominoBeam(scene, 0, 3.45, -1.0, 4.8, 0.5, 1.0, 'yellow');
        this.addDominoBeam(scene, 0, 3.45, 1.0, 4.8, 0.5, 1.0, 'yellow');

        // Upper TNT & Crowns
        this.addTNT(scene, 0, 4.4, 0);
        this.addRoyalCrown(scene, -1.4, 4.4, 0);
        this.addRoyalCrown(scene, 1.4, 4.4, 0);
        this.addRoyalCrown(scene, 0, 5.8, 0);

        return {
            name: "King's Citadel",
            ammo: 5,
            tip: "Two explosive cores! Trigger both upper and lower TNT!"
        };
    }

    // LEVEL 6: The Grand Palace
    buildLevel6(scene) {
        // Left & Right Towers
        [-3.2, 3.2].forEach((tx, i) => {
            this.addTallPillar(scene, tx - 0.7, 1.6, 0, 3.2, 'purple');
            this.addTallPillar(scene, tx + 0.7, 1.6, 0, 3.2, 'purple');
            this.addDominoBeam(scene, tx, 3.45, 0, 2.6, 0.5, 1.0, 'yellow');
            this.addTNT(scene, tx, 4.4, 0);
            this.addRoyalCrown(scene, tx, 5.6, 0);
        });

        // Center High Arch
        this.addCarnivalCan(scene, -1.2, 0.7, 0, 'red');
        this.addCarnivalCan(scene, 1.2, 0.7, 0, 'blue');
        this.addDominoBeam(scene, 0, 1.65, 0, 3.6, 0.45, 1.0, 'green');
        this.addToyCube(scene, -0.8, 2.4, 0, 1.0, 'red');
        this.addToyCube(scene, 0.8, 2.4, 0, 1.0, 'red');
        this.addTNT(scene, 0, 2.4, 0);
        this.addRoyalCrown(scene, 0, 3.6, 0);

        return {
            name: "The Imperial Palace",
            ammo: 5,
            tip: "The grand finale! Wipe out both towers with strategic chain reactions!"
        };
    }
}

window.Levels = new LevelBuilder();
