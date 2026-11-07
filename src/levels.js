// Royal Smash 3D - Level Layout Generator
// Builds destructible 3D structures with Three.js & Cannon.js

class LevelBuilder {
    constructor() {
        // Shared Three.js Geometries & Materials
        this.geometries = {
            crate: new THREE.BoxGeometry(1.2, 1.2, 1.2),
            stonePillar: new THREE.BoxGeometry(1.0, 3.2, 1.0),
            stoneBeam: new THREE.BoxGeometry(4.2, 0.8, 1.2),
            ironBlock: new THREE.BoxGeometry(1.4, 1.4, 1.4),
            tntBarrel: new THREE.CylinderGeometry(0.65, 0.65, 1.3, 16),
            urn: new THREE.CylinderGeometry(0.35, 0.55, 1.1, 12),
            crown: new THREE.ConeGeometry(0.45, 0.7, 8)
        };

        this.materials = {
            crate: new THREE.MeshStandardMaterial({
                color: 0xc48c48,
                roughness: 0.8,
                metalness: 0.05
            }),
            stone: new THREE.MeshStandardMaterial({
                color: 0x9399a3,
                roughness: 0.9,
                metalness: 0.1
            }),
            iron: new THREE.MeshStandardMaterial({
                color: 0x484f59,
                roughness: 0.35,
                metalness: 0.8
            }),
            tnt: new THREE.MeshStandardMaterial({
                color: 0xd92b2b,
                roughness: 0.6,
                metalness: 0.1
            }),
            tntBand: new THREE.MeshStandardMaterial({
                color: 0xffe600,
                roughness: 0.4
            }),
            gold: new THREE.MeshStandardMaterial({
                color: 0xffc83b,
                roughness: 0.25,
                metalness: 0.85
            })
        };
    }

    // Helper: Create Wooden Crate
    addCrate(scene, x, y, z) {
        const mesh = new THREE.Mesh(this.geometries.crate, this.materials.crate);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        const half = 0.6;
        const shape = new CANNON.Box(new CANNON.Vec3(half, half, half));
        const body = new CANNON.Body({
            mass: 4.5,
            material: window.Physics.blockMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape);

        window.Physics.addPair(body, mesh, true, { type: 'wood', points: 10 });
        return { mesh, body };
    }

    // Helper: Create Stone Pillar
    addStonePillar(scene, x, y, z) {
        const mesh = new THREE.Mesh(this.geometries.stonePillar, this.materials.stone);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        const shape = new CANNON.Box(new CANNON.Vec3(0.5, 1.6, 0.5));
        const body = new CANNON.Body({
            mass: 22.0,
            material: window.Physics.stoneMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape);

        window.Physics.addPair(body, mesh, true, { type: 'stone', points: 25 });
        return { mesh, body };
    }

    // Helper: Create Stone Beam
    addStoneBeam(scene, x, y, z) {
        const mesh = new THREE.Mesh(this.geometries.stoneBeam, this.materials.stone);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        const shape = new CANNON.Box(new CANNON.Vec3(2.1, 0.4, 0.6));
        const body = new CANNON.Body({
            mass: 28.0,
            material: window.Physics.stoneMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape);

        window.Physics.addPair(body, mesh, true, { type: 'stone', points: 30 });
        return { mesh, body };
    }

    // Helper: Create TNT Barrel
    addTNT(scene, x, y, z) {
        const group = new THREE.Group();
        const barrelMesh = new THREE.Mesh(this.geometries.tntBarrel, this.materials.tnt);
        barrelMesh.castShadow = true;
        barrelMesh.receiveShadow = true;
        group.add(barrelMesh);

        // Yellow warning band
        const bandGeo = new THREE.CylinderGeometry(0.66, 0.66, 0.35, 16);
        const bandMesh = new THREE.Mesh(bandGeo, this.materials.tntBand);
        group.add(bandMesh);
        scene.add(group);

        const shape = new CANNON.Cylinder(0.65, 0.65, 1.3, 12);
        const body = new CANNON.Body({
            mass: 3.5,
            material: window.Physics.tntMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape);

        // Collision listener: Trigger explosion if impacted with high impulse
        body.addEventListener('collide', (e) => {
            if (body.hasExploded) return;
            const contact = e.contact;
            const impactVelocity = contact.getImpactVelocityAlongNormal();
            if (impactVelocity > 4.5 || (e.target.gameMeta && e.target.gameMeta.isCannonBall)) {
                body.hasExploded = true;
                setTimeout(() => {
                    window.Physics.explode(body.position, 6.0, 85);
                    window.Physics.removeBody(body, group);
                }, 40);
            }
        });

        window.Physics.addPair(body, group, true, { type: 'tnt', points: 35 });
        return { mesh: group, body };
    }

    // Helper: Create Royal Golden Urn
    addGoldenUrn(scene, x, y, z) {
        const group = new THREE.Group();
        const urnMesh = new THREE.Mesh(this.geometries.urn, this.materials.gold);
        urnMesh.castShadow = true;
        group.add(urnMesh);

        const crownMesh = new THREE.Mesh(this.geometries.crown, this.materials.gold);
        crownMesh.position.y = 0.65;
        crownMesh.rotation.x = Math.PI;
        group.add(crownMesh);
        scene.add(group);

        const shape = new CANNON.Cylinder(0.45, 0.55, 1.1, 10);
        const body = new CANNON.Body({
            mass: 2.0,
            material: window.Physics.jarMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape);

        // Shatter collision
        body.addEventListener('collide', (e) => {
            if (body.hasShattered) return;
            const impactVelocity = e.contact.getImpactVelocityAlongNormal();
            if (impactVelocity > 3.0) {
                body.hasShattered = true;
                if (window.Sound) window.Sound.playShatter();
                if (window.Sound) window.Sound.playCoin();
                if (window.Game) window.Game.addCoins(50, body.position);
            }
        });

        window.Physics.addPair(body, group, true, { type: 'gold', points: 50 });
        return { mesh: group, body };
    }

    // Helper: Create Iron Block
    addIronBlock(scene, x, y, z) {
        const mesh = new THREE.Mesh(this.geometries.ironBlock, this.materials.iron);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        const shape = new CANNON.Box(new CANNON.Vec3(0.7, 0.7, 0.7));
        const body = new CANNON.Body({
            mass: 50.0,
            material: window.Physics.stoneMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape);

        window.Physics.addPair(body, mesh, true, { type: 'iron', points: 15 });
        return { mesh, body };
    }

    // Load Level Configuration
    loadLevel(levelIndex, scene) {
        window.Physics.clear();

        // 1. Build Ground Platform
        this.buildArenaPlatform(scene);

        // 2. Build Specific Level Structure
        let config = { ammo: 4, name: "Level" };

        switch (levelIndex) {
            case 1:
                config = this.buildLevel1(scene);
                break;
            case 2:
                config = this.buildLevel2(scene);
                break;
            case 3:
                config = this.buildLevel3(scene);
                break;
            case 4:
                config = this.buildLevel4(scene);
                break;
            case 5:
                config = this.buildLevel5(scene);
                break;
            case 6:
                config = this.buildLevel6(scene);
                break;
            default:
                config = this.buildLevel1(scene);
                break;
        }

        return config;
    }

    buildArenaPlatform(scene) {
        // Courtyard Pedestal
        const pedGeo = new THREE.BoxGeometry(16, 1.0, 16);
        const pedMat = new THREE.MeshStandardMaterial({
            color: 0x3d4b3b,
            roughness: 0.85
        });
        const platform = new THREE.Mesh(pedGeo, pedMat);
        platform.position.set(0, -0.5, 0);
        platform.receiveShadow = true;
        scene.add(platform);

        const groundShape = new CANNON.Box(new CANNON.Vec3(8, 0.5, 8));
        const groundBody = new CANNON.Body({
            mass: 0,
            material: window.Physics.groundMaterial,
            position: new CANNON.Vec3(0, -0.5, 0)
        });
        groundBody.addShape(groundShape);
        window.Physics.addPair(groundBody, platform, false);
    }

    // LEVEL 1: The Royal Watchtower
    buildLevel1(scene) {
        const cx = 0, cz = 0;
        // 4 stacked crates
        for (let y = 0; y < 4; y++) {
            this.addCrate(scene, cx, 0.6 + y * 1.25, cz);
        }
        // Golden Urn on top
        this.addGoldenUrn(scene, cx, 0.6 + 4 * 1.25, cz);

        return {
            name: "The Royal Watchtower",
            ammo: 4,
            tip: "Aim for the lower crate to topple the tower in a single shot!"
        };
    }

    // LEVEL 2: The Castle Gate
    buildLevel2(scene) {
        // Left & Right Stone Pillars
        this.addStonePillar(scene, -1.8, 1.6, 0);
        this.addStonePillar(scene, 1.8, 1.6, 0);

        // Cross beam
        this.addStoneBeam(scene, 0, 3.6, 0);

        // TNT on top center of bridge
        this.addTNT(scene, 0, 4.65, 0);

        // Golden urns on sides
        this.addGoldenUrn(scene, -1.5, 4.6, 0);
        this.addGoldenUrn(scene, 1.5, 4.6, 0);

        return {
            name: "The Castle Gate",
            ammo: 3,
            tip: "Hit the red TNT barrel on the bridge to trigger a massive collapse!"
        };
    }

    // LEVEL 3: Jester's Pyramid
    buildLevel3(scene) {
        const rows = [
            [-2.4, -1.2, 0, 1.2, 2.4], // 5 crates
            [-1.8, -0.6, 0.6, 1.8],    // 4 crates
            [-1.2, 0, 1.2],            // 3 items (TNT in center)
            [-0.6, 0.6],               // 2 crates
            [0]                        // Golden Crown
        ];

        let curY = 0.6;
        for (let r = 0; r < rows.length; r++) {
            const xs = rows[r];
            for (let i = 0; i < xs.length; i++) {
                const x = xs[i];
                if (r === 2 && i === 1) {
                    this.addTNT(scene, x, curY, 0);
                } else if (r === 4) {
                    this.addGoldenUrn(scene, x, curY, 0);
                } else {
                    this.addCrate(scene, x, curY, 0);
                }
            }
            curY += 1.25;
        }

        return {
            name: "Jester's Pyramid",
            ammo: 4,
            tip: "Find the structural weak point near the center TNT barrel!"
        };
    }

    // LEVEL 4: Iron Bastion
    buildLevel4(scene) {
        // Front Iron shields
        this.addIronBlock(scene, -1.6, 0.7, 1.5);
        this.addIronBlock(scene, 1.6, 0.7, 1.5);

        // Behind shields: Stone Pillars
        this.addStonePillar(scene, -1.6, 1.6, 0);
        this.addStonePillar(scene, 1.6, 1.6, 0);

        // TNT Barrels placed right at the foundation
        this.addTNT(scene, 0, 0.65, 0);

        // Roof Beam & Top Urns
        this.addStoneBeam(scene, 0, 3.6, 0);
        this.addGoldenUrn(scene, 0, 4.6, 0);
        this.addCrate(scene, -1.2, 4.6, 0);
        this.addCrate(scene, 1.2, 4.6, 0);

        return {
            name: "Iron Bastion",
            ammo: 4,
            tip: "Heavy iron blocks deflect shots. Curve your trajectory over them!"
        };
    }

    // LEVEL 5: King's Citadel
    buildLevel5(scene) {
        // 4 Corner Pillars
        this.addStonePillar(scene, -2.0, 1.6, -1.2);
        this.addStonePillar(scene, 2.0, 1.6, -1.2);
        this.addStonePillar(scene, -2.0, 1.6, 1.2);
        this.addStonePillar(scene, 2.0, 1.6, 1.2);

        // Double Bridge
        this.addStoneBeam(scene, 0, 3.6, -1.2);
        this.addStoneBeam(scene, 0, 3.6, 1.2);

        // TNT core in center
        this.addTNT(scene, 0, 0.65, 0);
        this.addTNT(scene, 0, 4.65, 0);

        // Golden Royal Treasure on highest deck
        this.addGoldenUrn(scene, -1.2, 4.65, 0);
        this.addGoldenUrn(scene, 1.2, 4.65, 0);
        this.addCrate(scene, 0, 5.8, 0);
        this.addGoldenUrn(scene, 0, 7.0, 0);

        return {
            name: "King's Citadel",
            ammo: 5,
            tip: "Double explosive layers! Trigger the upper and lower TNT!"
        };
    }

    // LEVEL 6: The Imperial Palace
    buildLevel6(scene) {
        // Twin Grand Towers
        [-3.2, 3.2].forEach(tx => {
            this.addStonePillar(scene, tx - 0.7, 1.6, 0);
            this.addStonePillar(scene, tx + 0.7, 1.6, 0);
            this.addStoneBeam(scene, tx, 3.6, 0);
            this.addTNT(scene, tx, 4.65, 0);
            this.addGoldenUrn(scene, tx, 5.8, 0);
        });

        // Center High Arch
        this.addCrate(scene, -1.2, 0.6, 0);
        this.addCrate(scene, 1.2, 0.6, 0);
        this.addCrate(scene, -1.2, 1.85, 0);
        this.addCrate(scene, 1.2, 1.85, 0);
        this.addStoneBeam(scene, 0, 2.8, 0);
        this.addTNT(scene, 0, 3.8, 0);
        this.addGoldenUrn(scene, 0, 4.9, 0);

        return {
            name: "The Imperial Palace",
            ammo: 5,
            tip: "Grand finale! Knock down the support bridge to trigger a chain reaction!"
        };
    }
}

window.Levels = new LevelBuilder();
