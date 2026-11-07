// Royal Smash 3D - Carnival & Castle Structures (Corrected Orientation & Stable Physics)

class LevelBuilder {
    constructor() {
        this.materials = {};
        this.initMaterials();
    }

    initMaterials() {
        const tex = window.Textures;

        this.materials = {
            blueBlock: new THREE.MeshPhongMaterial({
                color: 0x2563eb,
                specular: 0x93c5fd,
                shininess: 90
            }),
            redBlock: new THREE.MeshPhongMaterial({
                color: 0xef4444,
                specular: 0xfca5a5,
                shininess: 90
            }),
            yellowBlock: new THREE.MeshPhongMaterial({
                color: 0xf59e0b,
                specular: 0xfde047,
                shininess: 95
            }),
            greenBlock: new THREE.MeshPhongMaterial({
                color: 0x10b981,
                specular: 0x6ee7b7,
                shininess: 85
            }),
            purpleBlock: new THREE.MeshPhongMaterial({
                color: 0x8b5cf6,
                specular: 0xc4b5fd,
                shininess: 90
            }),
            redCan: new THREE.MeshPhongMaterial({
                map: tex ? tex.createCanTexture('#ef4444') : null,
                specular: 0xffffff,
                shininess: 80
            }),
            blueCan: new THREE.MeshPhongMaterial({
                map: tex ? tex.createCanTexture('#2563eb') : null,
                specular: 0xffffff,
                shininess: 80
            }),
            tnt: new THREE.MeshPhongMaterial({
                map: tex ? tex.createTNTTexture() : null,
                specular: 0xffffff,
                shininess: 70
            }),
            gold: new THREE.MeshPhongMaterial({
                color: 0xffd700,
                specular: 0xfffae5,
                shininess: 160
            }),
            pedestal: new THREE.MeshPhongMaterial({
                color: 0x1e293b,
                specular: 0x475569,
                shininess: 40
            })
        };
    }

    addEdgeOutline(mesh, geo, edgeColor = 0xffffff) {
        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: edgeColor,
            linewidth: 2,
            transparent: true,
            opacity: 0.65
        }));
        mesh.add(line);
    }

    // 1. Add Glossy Toy Cube
    addToyCube(scene, x, y, z, size = 1.2, colorType = 'blue') {
        const mat = this.materials[colorType + 'Block'] || this.materials.blueBlock;
        const geo = new THREE.BoxGeometry(size, size, size);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.addEdgeOutline(mesh, geo, 0xffffff);
        scene.add(mesh);

        const half = size / 2;
        const shape = new CANNON.Box(new CANNON.Vec3(half, half, half));
        const body = new CANNON.Body({
            mass: 2.2,
            material: window.Physics.blockMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape);

        window.Physics.addPair(body, mesh, true, { type: colorType, points: 15 });
        return { mesh, body };
    }

    // 2. Add Carnival Cans (Knockdown Cans with Rotated Vertical Cylinder Collider)
    addCarnivalCan(scene, x, y, z, color = 'red') {
        const mat = (color === 'red') ? this.materials.redCan : this.materials.blueCan;
        const geo = new THREE.CylinderGeometry(0.48, 0.48, 1.4, 20);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.addEdgeOutline(mesh, geo, 0xffffff);
        scene.add(mesh);

        // Cylinder shape rotated by 90 deg around X to align with Y axis
        const shape = new CANNON.Cylinder(0.48, 0.48, 1.4, 12);
        const q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);

        const body = new CANNON.Body({
            mass: 1.8,
            material: window.Physics.blockMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape, new CANNON.Vec3(0, 0, 0), q);

        window.Physics.addPair(body, mesh, true, { type: 'can', points: 20 });
        return { mesh, body };
    }

    // 3. Add Domino / Bridge Beam
    addDominoBeam(scene, x, y, z, width = 3.8, height = 0.5, depth = 1.0, color = 'yellow') {
        const mat = this.materials[color + 'Block'] || this.materials.yellowBlock;
        const geo = new THREE.BoxGeometry(width, height, depth);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.addEdgeOutline(mesh, geo, 0xffffff);
        scene.add(mesh);

        const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
        const body = new CANNON.Body({
            mass: width * 1.5,
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
        this.addEdgeOutline(mesh, geo, 0xffffff);
        scene.add(mesh);

        const shape = new CANNON.Box(new CANNON.Vec3(0.45, height / 2, 0.45));
        const body = new CANNON.Body({
            mass: height * 1.8,
            material: window.Physics.stoneMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape);

        window.Physics.addPair(body, mesh, true, { type: 'pillar', points: 30 });
        return { mesh, body };
    }

    // 5. Add Red Hazard TNT Barrel
    addTNT(scene, x, y, z) {
        const geo = new THREE.CylinderGeometry(0.65, 0.65, 1.4, 20);
        const mesh = new THREE.Mesh(geo, this.materials.tnt);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.addEdgeOutline(mesh, geo, 0xfacc15);
        scene.add(mesh);

        const shape = new CANNON.Cylinder(0.65, 0.65, 1.4, 12);
        const q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);

        const body = new CANNON.Body({
            mass: 2.5,
            material: window.Physics.tntMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape, new CANNON.Vec3(0, 0, 0), q);

        body.addEventListener('collide', (e) => {
            if (body.hasExploded) return;
            const contact = e.contact;
            const impactVelocity = contact.getImpactVelocityAlongNormal();
            if (impactVelocity > 3.0 || (e.target.gameMeta && e.target.gameMeta.isCannonBall)) {
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

    // 6. Add Royal Golden Crown Urn
    addRoyalCrown(scene, x, y, z) {
        const group = new THREE.Group();

        const cupGeo = new THREE.CylinderGeometry(0.42, 0.60, 1.05, 16);
        const cup = new THREE.Mesh(cupGeo, this.materials.gold);
        cup.castShadow = true;
        group.add(cup);

        const crownGeo = new THREE.ConeGeometry(0.48, 0.7, 8);
        const crown = new THREE.Mesh(crownGeo, this.materials.gold);
        crown.position.y = 0.7;
        crown.rotation.x = Math.PI;
        group.add(crown);
        scene.add(group);

        const shape = new CANNON.Cylinder(0.48, 0.60, 1.05, 10);
        const q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);

        const body = new CANNON.Body({
            mass: 1.6,
            material: window.Physics.jarMaterial,
            position: new CANNON.Vec3(x, y, z)
        });
        body.addShape(shape, new CANNON.Vec3(0, 0, 0), q);

        body.addEventListener('collide', (e) => {
            if (body.hasShattered) return;
            const impactVelocity = e.contact.getImpactVelocityAlongNormal();
            if (impactVelocity > 2.5) {
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

    buildArenaPlatform(scene) {
        const pedGeo = new THREE.BoxGeometry(16, 1.0, 16);
        const platform = new THREE.Mesh(pedGeo, this.materials.pedestal);
        platform.position.set(0, -0.5, 0);
        platform.receiveShadow = true;
        scene.add(platform);

        const rimGeo = new THREE.BoxGeometry(16.4, 0.25, 16.4);
        const rim = new THREE.Mesh(rimGeo, this.materials.gold);
        rim.position.set(0, 0.08, 0);
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

    // LEVEL 1: Carnival Knockdown Pyramid
    buildLevel1(scene) {
        const canXs = [-1.5, -0.5, 0.5, 1.5];
        canXs.forEach((x, i) => {
            this.addCarnivalCan(scene, x, 0.7, 0, i % 2 === 0 ? 'red' : 'blue');
        });

        this.addDominoBeam(scene, 0, 1.65, 0, 4.0, 0.5, 1.0, 'yellow');

        this.addToyCube(scene, -1.0, 2.5, 0, 1.1, 'blue');
        this.addToyCube(scene, 0, 2.5, 0, 1.1, 'red');
        this.addToyCube(scene, 1.0, 2.5, 0, 1.1, 'blue');

        this.addRoyalCrown(scene, 0, 3.85, 0);

        return {
            name: "Carnival Knockdown",
            ammo: 4,
            tip: "Hit the bottom cans or center beam to bring down the whole structure!"
        };
    }

    // LEVEL 2: The Royal Gate & TNT Core
    buildLevel2(scene) {
        this.addTallPillar(scene, -1.8, 1.6, 0, 3.2, 'purple');
        this.addTallPillar(scene, 1.8, 1.6, 0, 3.2, 'purple');

        this.addDominoBeam(scene, 0, 3.45, 0, 4.6, 0.5, 1.0, 'green');
        this.addTNT(scene, 0, 4.4, 0);

        this.addRoyalCrown(scene, -1.6, 4.3, 0);
        this.addRoyalCrown(scene, 1.6, 4.3, 0);

        return {
            name: "The Royal Gate",
            ammo: 3,
            tip: "Aim directly at the red TNT barrel for an explosive collapse!"
        };
    }

    // LEVEL 3: Jester's Multi-Tier Pyramid
    buildLevel3(scene) {
        [-2.0, -1.0, 0, 1.0, 2.0].forEach((x, i) => {
            this.addCarnivalCan(scene, x, 0.7, 0, i % 2 === 0 ? 'red' : 'blue');
        });

        this.addDominoBeam(scene, 0, 1.65, 0, 4.8, 0.5, 1.0, 'yellow');

        [-1.5, -0.5, 0.5, 1.5].forEach((x, i) => {
            this.addToyCube(scene, x, 2.45, 0, 1.0, i % 2 === 0 ? 'green' : 'red');
        });

        this.addDominoBeam(scene, 0, 3.2, 0, 3.6, 0.5, 1.0, 'yellow');

        this.addToyCube(scene, -1.0, 3.95, 0, 1.0, 'blue');
        this.addTNT(scene, 0, 3.95, 0);
        this.addToyCube(scene, 1.0, 3.95, 0, 1.0, 'blue');

        this.addRoyalCrown(scene, 0, 5.25, 0);

        return {
            name: "Jester's Wonder Pyramid",
            ammo: 4,
            tip: "Strike the lower tier to trigger a cascading domino chain reaction!"
        };
    }

    // LEVEL 4: The Royal Bastion
    buildLevel4(scene) {
        this.addToyCube(scene, -1.6, 0.75, 1.4, 1.4, 'blue');
        this.addToyCube(scene, 1.6, 0.75, 1.4, 1.4, 'blue');

        this.addTallPillar(scene, -1.6, 1.6, 0, 3.2, 'purple');
        this.addTallPillar(scene, 1.6, 1.6, 0, 3.2, 'purple');

        this.addTNT(scene, 0, 0.7, 0);

        this.addDominoBeam(scene, 0, 3.45, 0, 4.4, 0.5, 1.0, 'green');
        this.addRoyalCrown(scene, 0, 4.4, 0);
        this.addCarnivalCan(scene, -1.4, 4.4, 0, 'red');
        this.addCarnivalCan(scene, 1.4, 4.4, 0, 'blue');

        return {
            name: "The Royal Bastion",
            ammo: 4,
            tip: "Angle your cannon over the blue shield blocks to hit the TNT inside!"
        };
    }

    // LEVEL 5: King's Multi-Tier Citadel
    buildLevel5(scene) {
        this.addTallPillar(scene, -2.0, 1.6, -1.0, 3.2, 'purple');
        this.addTallPillar(scene, 2.0, 1.6, -1.0, 3.2, 'purple');
        this.addTallPillar(scene, -2.0, 1.6, 1.0, 3.2, 'purple');
        this.addTallPillar(scene, 2.0, 1.6, 1.0, 3.2, 'purple');

        this.addTNT(scene, 0, 0.7, 0);

        this.addDominoBeam(scene, 0, 3.45, -1.0, 4.8, 0.5, 1.0, 'yellow');
        this.addDominoBeam(scene, 0, 3.45, 1.0, 4.8, 0.5, 1.0, 'yellow');

        this.addTNT(scene, 0, 4.4, 0);
        this.addRoyalCrown(scene, -1.4, 4.4, 0);
        this.addRoyalCrown(scene, 1.4, 4.4, 0);
        this.addRoyalCrown(scene, 0, 5.8, 0);

        return {
            name: "King's Citadel",
            ammo: 5,
            tip: "Two explosive TNT cores! Trigger both upper and lower blasts!"
        };
    }

    // LEVEL 6: The Imperial Palace
    buildLevel6(scene) {
        [-3.2, 3.2].forEach((tx) => {
            this.addTallPillar(scene, tx - 0.7, 1.6, 0, 3.2, 'purple');
            this.addTallPillar(scene, tx + 0.7, 1.6, 0, 3.2, 'purple');
            this.addDominoBeam(scene, tx, 3.45, 0, 2.6, 0.5, 1.0, 'yellow');
            this.addTNT(scene, tx, 4.4, 0);
            this.addRoyalCrown(scene, tx, 5.6, 0);
        });

        this.addCarnivalCan(scene, -1.2, 0.7, 0, 'red');
        this.addCarnivalCan(scene, 1.2, 0.7, 0, 'blue');
        this.addDominoBeam(scene, 0, 1.65, 0, 3.6, 0.5, 1.0, 'green');
        this.addToyCube(scene, -0.8, 2.45, 0, 1.0, 'red');
        this.addToyCube(scene, 0.8, 2.45, 0, 1.0, 'red');
        this.addTNT(scene, 0, 2.45, 0);
        this.addRoyalCrown(scene, 0, 3.65, 0);

        return {
            name: "The Imperial Palace",
            ammo: 5,
            tip: "The grand finale! Wipe out both towers with strategic chain reactions!"
        };
    }
}

window.Levels = new LevelBuilder();
