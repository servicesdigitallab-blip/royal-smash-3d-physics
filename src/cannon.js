// Royal Cannon ("Toop") System & Aiming Controller
// Handles 3D Cannon mesh, barrel recoil, aiming trajectory arc, and projectile physics

class CannonController {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.barrel = null;
        this.recoilOffset = 0;
        this.isRecoiling = false;

        // Position cannon in front of target structure
        this.position = new THREE.Vector3(0, 0.4, 11.5);
        this.pitch = 0.22; // Initial elevation
        this.yaw = 0.0;   // Initial horizontal aim

        this.trajectoryLine = null;
        this.maxTrajectoryPoints = 40;

        this.buildCannonMesh();
        this.buildTrajectoryVisualizer();
        this.scene.add(this.group);
    }

    buildCannonMesh() {
        this.group.position.copy(this.position);

        // 1. Carriage (Wooden base)
        const carriageMat = new THREE.MeshStandardMaterial({ color: 0x542d13, roughness: 0.8 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xffcc33, metalness: 0.85, roughness: 0.2 });

        const baseGeo = new THREE.BoxGeometry(1.4, 0.4, 1.8);
        const baseMesh = new THREE.Mesh(baseGeo, carriageMat);
        baseMesh.position.y = 0.25;
        baseMesh.castShadow = true;
        this.group.add(baseMesh);

        // Carriage Golden Trims
        const trimGeo = new THREE.BoxGeometry(1.45, 0.1, 1.85);
        const trimMesh = new THREE.Mesh(trimGeo, goldMat);
        trimMesh.position.y = 0.45;
        this.group.add(trimMesh);

        // 2. Wheels (Left & Right)
        const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.22, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x3d210d, roughness: 0.7 });

        [-0.8, 0.8].forEach(x => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, 0.4, 0);
            wheel.castShadow = true;

            // Golden Hubcap
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.26, 12), goldMat);
            hub.rotation.z = Math.PI / 2;
            hub.position.set(x, 0.4, 0);

            this.group.add(wheel);
            this.group.add(hub);
        });

        // 3. Cannon Pivot & Barrel
        this.barrelPivot = new THREE.Group();
        this.barrelPivot.position.set(0, 0.7, 0);
        this.group.add(this.barrelPivot);

        // Tapered Barrel
        const barrelMat = new THREE.MeshStandardMaterial({
            color: 0x24272c,
            metalness: 0.75,
            roughness: 0.3
        });
        const barrelGeo = new THREE.CylinderGeometry(0.28, 0.42, 2.2, 20);
        this.barrel = new THREE.Mesh(barrelGeo, barrelMat);
        this.barrel.rotation.x = Math.PI / 2;
        this.barrel.position.z = -0.7; // Center pivot towards back
        this.barrel.castShadow = true;
        this.barrelPivot.add(this.barrel);

        // Golden Muzzle Rings
        const ringGeo = new THREE.TorusGeometry(0.33, 0.06, 12, 24);
        const muzzleRing = new THREE.Mesh(ringGeo, goldMat);
        muzzleRing.position.y = 1.0;
        this.barrel.add(muzzleRing);

        // Rear Breech Ball
        const ballGeo = new THREE.SphereGeometry(0.38, 16, 16);
        const breechBall = new THREE.Mesh(ballGeo, goldMat);
        breechBall.position.y = -1.1;
        this.barrel.add(breechBall);

        // Flash Light for firing
        this.flashLight = new THREE.PointLight(0xffaa22, 0, 8);
        this.flashLight.position.set(0, 0, -2.0);
        this.barrelPivot.add(this.flashLight);

        this.updateRotation();
    }

    buildTrajectoryVisualizer() {
        const positions = new Float32Array(this.maxTrajectoryPoints * 3);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.LineDashedMaterial({
            color: 0xffd700,
            dashSize: 0.3,
            gapSize: 0.2,
            linewidth: 3
        });

        this.trajectoryLine = new THREE.Line(geometry, material);
        this.trajectoryLine.frustumCulled = false;
        this.scene.add(this.trajectoryLine);
    }

    setAim(pitch, yaw) {
        // Clamp angles to realistic firing arcs
        this.pitch = Math.max(0.05, Math.min(pitch, 0.75));
        this.yaw = Math.max(-0.55, Math.min(yaw, 0.55));
        this.updateRotation();
        this.updateTrajectory();
    }

    updateRotation() {
        if (!this.barrelPivot) return;
        this.barrelPivot.rotation.y = this.yaw;
        this.barrelPivot.rotation.x = this.pitch;
    }

    getMuzzlePosition() {
        const muzzleLocal = new THREE.Vector3(0, 0, -2.0);
        this.barrelPivot.localToWorld(muzzleLocal);
        return muzzleLocal;
    }

    getFiringVelocity(baseSpeed = 34) {
        const dir = new THREE.Vector3(0, 0, -1);
        dir.applyEuler(this.barrelPivot.rotation);
        dir.normalize();
        return dir.multiplyScalar(baseSpeed);
    }

    updateTrajectory(speed = 34) {
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
            if (py < 0) break; // Stop at ground level
        }

        this.trajectoryLine.geometry.attributes.position.needsUpdate = true;
        this.trajectoryLine.computeLineDistances();
    }

    triggerRecoil() {
        this.isRecoiling = true;
        this.recoilOffset = 0.45;
        this.flashLight.intensity = 5;

        setTimeout(() => {
            if (this.flashLight) this.flashLight.intensity = 0;
        }, 60);
    }

    update(dt) {
        // Smooth recoil recovery
        if (this.isRecoiling) {
            this.recoilOffset -= dt * 2.2;
            if (this.recoilOffset <= 0) {
                this.recoilOffset = 0;
                this.isRecoiling = false;
            }
            if (this.barrel) {
                this.barrel.position.z = -0.7 + this.recoilOffset;
            }
        }
    }

    // Fire Cannonballs based on equipped Cannon Type
    fire(cannonType = 'standard', powerBonus = 1.0) {
        this.triggerRecoil();

        const isExplosive = (cannonType === 'inferno');
        if (window.Sound) window.Sound.playCannonFire(isExplosive);

        const startPos = this.getMuzzlePosition();
        const baseSpeed = (cannonType === 'dragon' ? 42 : 35) * powerBonus;

        if (cannonType === 'triple') {
            // Fires 3 balls in a spread
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

        // Three.js Mesh
        let radius = 0.35;
        let ballColor = 0x222222;
        let metal = 0.9;
        let rough = 0.2;

        if (cannonType === 'dragon') {
            ballColor = 0xffd700; // Gold
            radius = 0.42;
        } else if (cannonType === 'inferno') {
            ballColor = 0xff3300; // Glowing Orange/Red
            rough = 0.1;
        } else if (cannonType === 'bouncy') {
            ballColor = 0x00e5ff; // Neon Cyan Rubber
            rough = 0.8;
            metal = 0.0;
        }

        const ballGeo = new THREE.SphereGeometry(radius, 16, 16);
        const ballMat = new THREE.MeshStandardMaterial({
            color: ballColor,
            metalness: metal,
            roughness: rough
        });
        const ballMesh = new THREE.Mesh(ballGeo, ballMat);
        ballMesh.castShadow = true;
        this.scene.add(ballMesh);

        // Cannon.js Rigid Body
        let mass = 8.0;
        if (cannonType === 'dragon') mass = 18.0;
        if (cannonType === 'bouncy') mass = 6.0;

        const ballShape = new CANNON.Sphere(radius);
        const ballBody = new CANNON.Body({
            mass: mass,
            material: window.Physics.ballMaterial,
            position: new CANNON.Vec3(startPos.x, startPos.y, startPos.z)
        });
        ballBody.addShape(ballShape);
        ballBody.velocity.set(velVec.x, velVec.y, velVec.z);

        // Specific behavior handlers
        if (cannonType === 'bouncy') {
            ballBody.material.restitution = 0.88;
        }

        ballBody.addEventListener('collide', (e) => {
            const impactVelocity = e.contact.getImpactVelocityAlongNormal();
            if (impactVelocity > 2.0 && window.Sound) {
                window.Sound.playImpact(impactVelocity / 15);
            }

            // Inferno exploding round
            if (cannonType === 'inferno' && !ballBody.hasDetonated) {
                ballBody.hasDetonated = true;
                setTimeout(() => {
                    window.Physics.explode(ballBody.position, 5.5, 75);
                    window.Physics.removeBody(ballBody, ballMesh);
                }, 30);
            }
        });

        window.Physics.addPair(ballBody, ballMesh, false, { isCannonBall: true });
        window.Physics.activeBalls.push({ body: ballBody, mesh: ballMesh, lifeTime: 0 });

        // Muzzle Smoke Burst Particle
        if (window.Game) {
            window.Game.spawnSmokeBurst(startPos);
        }
    }
}

window.CannonController = CannonController;
