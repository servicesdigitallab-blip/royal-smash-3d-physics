// Royal Cannon ("Toop") System & Aiming Controller (Royal Smash Edition)
// Features Royal Blue & Gold Cannon with Crown Muzzle, Spring Piston, Star-patterned Animated Ball, and Particle Trails

class CannonController {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.barrel = null;
        this.spring = null;
        this.loadedBallPreview = null;
        this.recoilOffset = 0;
        this.springSquash = 1.0;
        this.isRecoiling = false;

        this.position = new THREE.Vector3(0, 0.4, 11.5);
        this.pitch = 0.22;
        this.yaw = 0.0;

        this.trajectoryLine = null;
        this.maxTrajectoryPoints = 42;

        this.buildCannonMesh();
        this.buildTrajectoryVisualizer();
        this.scene.add(this.group);
    }

    buildCannonMesh() {
        this.group.position.copy(this.position);

        // Materials matching Royal Smash Icon:
        const royalBlueMat = new THREE.MeshStandardMaterial({
            color: 0x1d4ed8,
            roughness: 0.25,
            metalness: 0.35
        });
        const royalRedMat = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            roughness: 0.35,
            metalness: 0.2
        });
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xfbbf24,
            metalness: 0.85,
            roughness: 0.2
        });
        const darkWoodMat = new THREE.MeshStandardMaterial({
            color: 0x451a03,
            roughness: 0.7
        });

        // 1. Carriage (Red & Gold Circus/Royal base)
        const baseGeo = new THREE.BoxGeometry(1.5, 0.45, 1.9);
        const baseMesh = new THREE.Mesh(baseGeo, royalRedMat);
        baseMesh.position.y = 0.25;
        baseMesh.castShadow = true;
        this.group.add(baseMesh);

        // Golden Filigree Trims
        const trimGeo = new THREE.BoxGeometry(1.56, 0.1, 1.96);
        const trimMesh = new THREE.Mesh(trimGeo, goldMat);
        trimMesh.position.y = 0.48;
        this.group.add(trimMesh);

        // 2. Wheels with Golden Spoke Trim
        const wheelGeo = new THREE.CylinderGeometry(0.58, 0.58, 0.24, 18);
        [-0.88, 0.88].forEach(x => {
            const wheel = new THREE.Mesh(wheelGeo, darkWoodMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, 0.45, 0);
            wheel.castShadow = true;

            // Golden Tire Rim
            const rim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.05, 8, 20), goldMat);
            rim.rotation.y = Math.PI / 2;
            rim.position.set(x, 0.45, 0);

            // Golden Hubcap
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.28, 12), goldMat);
            hub.rotation.z = Math.PI / 2;
            hub.position.set(x, 0.45, 0);

            this.group.add(wheel);
            this.group.add(rim);
            this.group.add(hub);
        });

        // 3. Cannon Pivot & Barrel
        this.barrelPivot = new THREE.Group();
        this.barrelPivot.position.set(0, 0.75, 0);
        this.group.add(this.barrelPivot);

        // Main Royal Blue Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.36, 0.48, 2.3, 24);
        this.barrel = new THREE.Mesh(barrelGeo, royalBlueMat);
        this.barrel.rotation.x = Math.PI / 2;
        this.barrel.position.z = -0.7;
        this.barrel.castShadow = true;
        this.barrelPivot.add(this.barrel);

        // Golden Middle Ring with Studs
        const midRing = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.06, 12, 24), goldMat);
        midRing.position.y = 0.2;
        this.barrel.add(midRing);

        // Golden Crown Battlements / Spikes at Muzzle (Icon Feature!)
        const crownMuzzle = new THREE.Mesh(new THREE.TorusGeometry(0.40, 0.08, 12, 24), goldMat);
        crownMuzzle.position.y = 1.15;
        this.barrel.add(crownMuzzle);

        // 8 Crown Spikes around the muzzle
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const spikeGeo = new THREE.ConeGeometry(0.08, 0.22, 6);
            const spike = new THREE.Mesh(spikeGeo, goldMat);
            spike.position.set(Math.cos(angle) * 0.40, 1.25, Math.sin(angle) * 0.40);
            spike.rotation.z = -Math.cos(angle) * 0.3;
            spike.rotation.x = Math.sin(angle) * 0.3;
            this.barrel.add(spike);
        }

        // Rear Golden Breach Ball
        const breechBall = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 16), goldMat);
        breechBall.position.y = -1.15;
        this.barrel.add(breechBall);

        // 4. Golden Spring / Piston (Icon Feature!)
        const springGroup = new THREE.Group();
        const coilCount = 5;
        for (let c = 0; c < coilCount; c++) {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 8, 16), goldMat);
            ring.position.y = (c - coilCount / 2) * 0.14;
            springGroup.add(ring);
        }
        springGroup.position.set(0, 0, -1.6);
        this.barrelPivot.add(springGroup);
        this.spring = springGroup;

        // 5. Loaded Star Ball Preview (Sitting in the muzzle ready to launch)
        const starTexture = window.Textures ? window.Textures.createStarBallTexture() : null;
        const ballMat = new THREE.MeshStandardMaterial({
            map: starTexture,
            roughness: 0.2,
            metalness: 0.1
        });
        this.loadedBallPreview = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 24), ballMat);
        this.loadedBallPreview.position.set(0, 0, -2.15);
        this.barrelPivot.add(this.loadedBallPreview);

        // Muzzle Flash Light
        this.flashLight = new THREE.PointLight(0xffaa22, 0, 10);
        this.flashLight.position.set(0, 0, -2.3);
        this.barrelPivot.add(this.flashLight);

        this.updateRotation();
    }

    buildTrajectoryVisualizer() {
        const positions = new Float32Array(this.maxTrajectoryPoints * 3);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.LineDashedMaterial({
            color: 0xffd700,
            dashSize: 0.35,
            gapSize: 0.2,
            linewidth: 4
        });

        this.trajectoryLine = new THREE.Line(geometry, material);
        this.trajectoryLine.frustumCulled = false;
        this.scene.add(this.trajectoryLine);
    }

    setAim(pitch, yaw) {
        this.pitch = Math.max(0.05, Math.min(pitch, 0.75));
        this.yaw = Math.max(-0.55, Math.min(yaw, 0.55));
        this.updateRotation();
        this.updateTrajectory();

        // Squash spring backwards while aiming
        this.springSquash = 0.7;
    }

    updateRotation() {
        if (!this.barrelPivot) return;
        this.barrelPivot.rotation.y = this.yaw;
        this.barrelPivot.rotation.x = this.pitch;
    }

    getMuzzlePosition() {
        const muzzleLocal = new THREE.Vector3(0, 0, -2.2);
        this.barrelPivot.localToWorld(muzzleLocal);
        return muzzleLocal;
    }

    getFiringVelocity(baseSpeed = 36) {
        const dir = new THREE.Vector3(0, 0, -1);
        dir.applyEuler(this.barrelPivot.rotation);
        dir.normalize();
        return dir.multiplyScalar(baseSpeed);
    }

    updateTrajectory(speed = 36) {
        if (!this.trajectoryLine) return;

        const startPos = this.getMuzzlePosition();
        const velocity = this.getFiringVelocity(speed);
        const gravity = -9.82;
        const dt = 0.045;

        const positions = this.trajectoryLine.geometry.attributes.position.array;
        let px = startPos.x;
        let py = startPos.y;
        let pz = startPos.z;

        let vx = velocity.x;
        let vy = velocity.y;
        let vz = velocity.z;

        for (let i = 0; i < this.maxTrajectoryPoints; i++) {
            positions[i * 3 + 0] = px;
            positions[i * 3 + 1] = py;
            positions[i * 3 + 2] = pz;

            px += vx * dt;
            py += vy * dt + 0.5 * gravity * dt * dt;
            pz += vz * dt;

            vy += gravity * dt;
            if (py < 0) break;
        }

        this.trajectoryLine.geometry.attributes.position.needsUpdate = true;
        this.trajectoryLine.computeLineDistances();
    }

    triggerRecoil() {
        this.isRecoiling = true;
        this.recoilOffset = 0.55;
        this.springSquash = 1.45; // Spring pops out on launch
        this.flashLight.intensity = 6;

        // Hide loaded ball preview while firing
        if (this.loadedBallPreview) {
            this.loadedBallPreview.visible = false;
            setTimeout(() => {
                if (this.loadedBallPreview) this.loadedBallPreview.visible = true;
            }, 450);
        }

        setTimeout(() => {
            if (this.flashLight) this.flashLight.intensity = 0;
        }, 80);

        // Trigger Screen Shake
        if (window.Game) window.Game.triggerScreenShake(0.35);
    }

    update(dt) {
        // Smooth recoil & spring recovery
        if (this.isRecoiling) {
            this.recoilOffset -= dt * 2.8;
            if (this.recoilOffset <= 0) {
                this.recoilOffset = 0;
                this.isRecoiling = false;
            }
            if (this.barrel) {
                this.barrel.position.z = -0.7 + this.recoilOffset;
            }
        }

        // Spring damping back to 1.0
        this.springSquash += (1.0 - this.springSquash) * (dt * 8);
        if (this.spring) {
            this.spring.scale.set(1.0, 1.0, this.springSquash);
        }

        // Idle gentle breathing animation for the loaded ball
        if (this.loadedBallPreview && this.loadedBallPreview.visible) {
            this.loadedBallPreview.rotation.y += dt * 1.5;
            this.loadedBallPreview.rotation.x += dt * 0.8;
        }
    }

    fire(cannonType = 'standard', powerBonus = 1.0) {
        this.triggerRecoil();

        const isExplosive = (cannonType === 'inferno');
        if (window.Sound) window.Sound.playCannonFire(isExplosive);

        const startPos = this.getMuzzlePosition();
        const baseSpeed = (cannonType === 'dragon' ? 44 : 37) * powerBonus;

        if (cannonType === 'triple') {
            [-0.08, 0, 0.08].forEach(spreadYaw => {
                this.spawnProjectile(startPos, baseSpeed, cannonType, spreadYaw);
            });
        } else {
            this.spawnProjectile(startPos, baseSpeed, cannonType, 0);
        }
    }

    spawnProjectile(startPos, speed, cannonType, yawSpread = 0) {
        const velVec = this.getFiringVelocity(speed);
        if (yawSpread !== 0) {
            velVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawSpread);
        }

        // Ball Mesh with Star Carnival Texture
        let radius = 0.38;
        let texture = window.Textures ? window.Textures.createStarBallTexture() : null;
        let color = 0xffffff;
        let metal = 0.15;
        let rough = 0.2;

        if (cannonType === 'dragon') {
            color = 0xffd700;
            texture = null; // Shiny pure gold
            metal = 0.95;
            rough = 0.1;
            radius = 0.44;
        } else if (cannonType === 'inferno') {
            color = 0xff4500;
            texture = null;
            metal = 0.0;
            rough = 0.05;
        } else if (cannonType === 'bouncy') {
            color = 0x06b6d4;
            texture = null;
            metal = 0.0;
            rough = 0.9;
        }

        const ballGeo = new THREE.SphereGeometry(radius, 24, 24);
        const ballMat = new THREE.MeshStandardMaterial({
            color: color,
            map: texture,
            metalness: metal,
            roughness: rough
        });
        const ballMesh = new THREE.Mesh(ballGeo, ballMat);
        ballMesh.castShadow = true;
        this.scene.add(ballMesh);

        // Rigid Body
        let mass = 8.5;
        if (cannonType === 'dragon') mass = 20.0;
        if (cannonType === 'bouncy') mass = 6.0;

        const ballShape = new CANNON.Sphere(radius);
        const ballBody = new CANNON.Body({
            mass: mass,
            material: window.Physics.ballMaterial,
            position: new CANNON.Vec3(startPos.x, startPos.y, startPos.z)
        });
        ballBody.addShape(ballShape);
        ballBody.velocity.set(velVec.x, velVec.y, velVec.z);

        // Dynamic 3D spin on the ball! ("Goala animation")
        ballBody.angularVelocity.set(
            (Math.random() - 0.5) * 15,
            Math.random() * 20 + 10,
            (Math.random() - 0.5) * 15
        );

        if (cannonType === 'bouncy') {
            ballBody.material.restitution = 0.92;
        }

        ballBody.addEventListener('collide', (e) => {
            const impactVelocity = e.contact.getImpactVelocityAlongNormal();
            if (impactVelocity > 2.0 && window.Sound) {
                window.Sound.playImpact(impactVelocity / 14);
                if (window.Game) window.Game.triggerScreenShake(Math.min(impactVelocity * 0.03, 0.25));
            }

            if (cannonType === 'inferno' && !ballBody.hasDetonated) {
                ballBody.hasDetonated = true;
                setTimeout(() => {
                    window.Physics.explode(ballBody.position, 6.0, 80);
                    window.Physics.removeBody(ballBody, ballMesh);
                }, 30);
            }
        });

        window.Physics.addPair(ballBody, ballMesh, false, { isCannonBall: true });
        window.Physics.activeBalls.push({
            body: ballBody,
            mesh: ballMesh,
            lifeTime: 0,
            type: cannonType,
            trailTimer: 0
        });

        // Muzzle blast smoke and star sparks
        if (window.Game) {
            window.Game.spawnMuzzleBlast(startPos);
        }
    }
}

window.CannonController = CannonController;
