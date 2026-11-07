// Royal Cannon ("Toop") Controller - Flared Cartoon Bell-Mouth Barrel & Responsive Aiming

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

        // Positioned clearly in front of the platform
        this.position = new THREE.Vector3(0, 0.45, 10.8);
        this.pitch = 0.22;
        this.yaw = 0.0;

        this.trajectoryLine = null;
        this.maxTrajectoryPoints = 48;

        this.buildCannonMesh();
        this.buildTrajectoryVisualizer();
        this.scene.add(this.group);
    }

    buildCannonMesh() {
        this.group.position.copy(this.position);

        const royalBlueMat = new THREE.MeshPhongMaterial({
            color: 0x1d4ed8,
            specular: 0x93c5fd,
            shininess: 90
        });
        const royalRedMat = new THREE.MeshPhongMaterial({
            color: 0xef4444,
            specular: 0xfca5a5,
            shininess: 85
        });
        const goldMat = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            specular: 0xfffae5,
            shininess: 150
        });
        const darkWoodMat = new THREE.MeshPhongMaterial({
            color: 0x3d1a04,
            specular: 0x78350f,
            shininess: 40
        });

        // 1. Carriage Base (Royal Red & Gold Chassis)
        const baseGeo = new THREE.BoxGeometry(1.6, 0.5, 2.0);
        const baseMesh = new THREE.Mesh(baseGeo, royalRedMat);
        baseMesh.position.y = 0.25;
        baseMesh.castShadow = true;
        this.group.add(baseMesh);

        // Gold Filigree Side Panels
        const trimGeo = new THREE.BoxGeometry(1.68, 0.12, 2.08);
        const trimMesh = new THREE.Mesh(trimGeo, goldMat);
        trimMesh.position.y = 0.52;
        this.group.add(trimMesh);

        // 2. Large Cannon Wheels with Golden Rims & Studs
        const wheelRadius = 0.65;
        const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.26, 20);
        [-0.95, 0.95].forEach(x => {
            const wheel = new THREE.Mesh(wheelGeo, darkWoodMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, 0.5, 0);
            wheel.castShadow = true;

            // Golden Rim
            const rim = new THREE.Mesh(new THREE.TorusGeometry(wheelRadius, 0.06, 8, 24), goldMat);
            rim.rotation.y = Math.PI / 2;
            rim.position.set(x, 0.5, 0);

            // Hubcap
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.3, 16), goldMat);
            hub.rotation.z = Math.PI / 2;
            hub.position.set(x, 0.5, 0);

            this.group.add(wheel);
            this.group.add(rim);
            this.group.add(hub);
        });

        // 3. Cannon Pivot & Barrel
        this.barrelPivot = new THREE.Group();
        this.barrelPivot.position.set(0, 0.8, 0);
        this.group.add(this.barrelPivot);

        // Classic Flared Cartoon Cannon Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.38, 0.52, 2.5, 24);
        this.barrel = new THREE.Mesh(barrelGeo, royalBlueMat);
        this.barrel.rotation.x = Math.PI / 2;
        this.barrel.position.z = -0.75;
        this.barrel.castShadow = true;
        this.barrelPivot.add(this.barrel);

        // Gold Reinforcing Rings
        const midRing = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.07, 12, 24), goldMat);
        midRing.position.y = 0.2;
        this.barrel.add(midRing);

        // Flared Muzzle Bell-Mouth (Front)
        const bellMouth = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.38, 0.35, 24), goldMat);
        bellMouth.position.y = 1.25;
        this.barrel.add(bellMouth);

        // Crown Muzzle Battlements / Spikes (Icon feature!)
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 6), goldMat);
            spike.position.set(Math.cos(angle) * 0.46, 1.45, Math.sin(angle) * 0.46);
            spike.rotation.z = -Math.cos(angle) * 0.35;
            spike.rotation.x = Math.sin(angle) * 0.35;
            this.barrel.add(spike);
        }

        // Golden Breach Ball (Rear)
        const breech = new THREE.Mesh(new THREE.SphereGeometry(0.48, 18, 18), goldMat);
        breech.position.y = -1.25;
        this.barrel.add(breech);

        // 4. Golden Spring / Piston (Icon Feature!)
        const springGroup = new THREE.Group();
        for (let c = 0; c < 5; c++) {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.045, 8, 16), goldMat);
            ring.position.y = (c - 2) * 0.15;
            springGroup.add(ring);
        }
        springGroup.position.set(0, 0, -1.75);
        this.barrelPivot.add(springGroup);
        this.spring = springGroup;

        // 5. Loaded Star Ball Preview (Sitting in the muzzle)
        const starTexture = window.Textures ? window.Textures.createStarBallTexture() : null;
        const ballMat = new THREE.MeshPhongMaterial({
            map: starTexture,
            specular: 0xffffff,
            shininess: 120
        });
        this.loadedBallPreview = new THREE.Mesh(new THREE.SphereGeometry(0.40, 24, 24), ballMat);
        this.loadedBallPreview.position.set(0, 0, -2.35);
        this.barrelPivot.add(this.loadedBallPreview);

        // Muzzle Flash PointLight
        this.flashLight = new THREE.PointLight(0xffea00, 0, 14);
        this.flashLight.position.set(0, 0, -2.5);
        this.barrelPivot.add(this.flashLight);

        this.updateRotation();
    }

    buildTrajectoryVisualizer() {
        const positions = new Float32Array(this.maxTrajectoryPoints * 3);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.LineDashedMaterial({
            color: 0xffd700,
            dashSize: 0.38,
            gapSize: 0.22,
            linewidth: 4
        });

        this.trajectoryLine = new THREE.Line(geometry, material);
        this.trajectoryLine.frustumCulled = false;
        this.scene.add(this.trajectoryLine);
    }

    setAim(pitch, yaw) {
        this.pitch = Math.max(0.04, Math.min(pitch, 0.72));
        this.yaw = Math.max(-0.6, Math.min(yaw, 0.6));
        this.updateRotation();
        this.updateTrajectory();
        this.springSquash = 0.75;
    }

    updateRotation() {
        if (!this.barrelPivot) return;
        this.barrelPivot.rotation.y = this.yaw;
        this.barrelPivot.rotation.x = this.pitch;
    }

    getMuzzlePosition() {
        const muzzleLocal = new THREE.Vector3(0, 0, -2.4);
        this.barrelPivot.localToWorld(muzzleLocal);
        return muzzleLocal;
    }

    getFiringVelocity(baseSpeed = 46) {
        const dir = new THREE.Vector3(0, 0, -1);
        dir.applyEuler(this.barrelPivot.rotation);
        dir.normalize();
        return dir.multiplyScalar(baseSpeed);
    }

    updateTrajectory(speed = 46) {
        if (!this.trajectoryLine) return;

        const startPos = this.getMuzzlePosition();
        const velocity = this.getFiringVelocity(speed);
        const gravity = -11.5;
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
        this.recoilOffset = 0.65;
        this.springSquash = 1.55;
        this.flashLight.intensity = 10;

        if (this.loadedBallPreview) {
            this.loadedBallPreview.visible = false;
            setTimeout(() => {
                if (this.loadedBallPreview) this.loadedBallPreview.visible = true;
            }, 450);
        }

        setTimeout(() => {
            if (this.flashLight) this.flashLight.intensity = 0;
        }, 80);

        if (window.Game) window.Game.triggerScreenShake(0.45);
    }

    update(dt) {
        if (this.isRecoiling) {
            this.recoilOffset -= dt * 3.2;
            if (this.recoilOffset <= 0) {
                this.recoilOffset = 0;
                this.isRecoiling = false;
            }
            if (this.barrel) {
                this.barrel.position.z = -0.75 + this.recoilOffset;
            }
        }

        this.springSquash += (1.0 - this.springSquash) * (dt * 8);
        if (this.spring) {
            this.spring.scale.set(1.0, 1.0, this.springSquash);
        }

        if (this.loadedBallPreview && this.loadedBallPreview.visible) {
            this.loadedBallPreview.rotation.y += dt * 1.8;
            this.loadedBallPreview.rotation.x += dt * 1.0;
        }
    }

    fire(cannonType = 'standard', powerBonus = 1.0) {
        this.triggerRecoil();

        const isExplosive = (cannonType === 'inferno');
        if (window.Sound) window.Sound.playCannonFire(isExplosive);

        const startPos = this.getMuzzlePosition();
        const baseSpeed = (cannonType === 'dragon' ? 54 : 46) * powerBonus;

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

        let radius = 0.40;
        let texture = window.Textures ? window.Textures.createStarBallTexture() : null;
        let color = 0xffffff;
        let specular = 0xffffff;
        let shininess = 120;

        if (cannonType === 'dragon') {
            color = 0xffd700;
            texture = null;
            specular = 0xfffae5;
            shininess = 160;
            radius = 0.46;
        } else if (cannonType === 'inferno') {
            color = 0xff3d00;
            texture = null;
            specular = 0xffaa00;
            shininess = 90;
        } else if (cannonType === 'bouncy') {
            color = 0x00e5ff;
            texture = null;
            specular = 0x80d8ff;
            shininess = 60;
        }

        const ballGeo = new THREE.SphereGeometry(radius, 24, 24);
        const ballMat = new THREE.MeshPhongMaterial({
            color: color,
            map: texture,
            specular: specular,
            shininess: shininess
        });
        const ballMesh = new THREE.Mesh(ballGeo, ballMat);
        ballMesh.castShadow = true;
        this.scene.add(ballMesh);

        let mass = 14.0;
        if (cannonType === 'dragon') mass = 28.0;
        if (cannonType === 'bouncy') mass = 8.0;

        const ballShape = new CANNON.Sphere(radius);
        const ballBody = new CANNON.Body({
            mass: mass,
            material: window.Physics.ballMaterial,
            position: new CANNON.Vec3(startPos.x, startPos.y, startPos.z)
        });
        ballBody.addShape(ballShape);
        ballBody.velocity.set(velVec.x, velVec.y, velVec.z);

        // Spin in Flight
        ballBody.angularVelocity.set(
            (Math.random() - 0.5) * 20,
            Math.random() * 25 + 15,
            (Math.random() - 0.5) * 20
        );

        if (cannonType === 'bouncy') {
            ballBody.material.restitution = 0.94;
        }

        // High-Impact Collision
        ballBody.addEventListener('collide', (e) => {
            const impactVelocity = e.contact.getImpactVelocityAlongNormal();
            if (impactVelocity > 2.0 && window.Sound) {
                window.Sound.playImpact(impactVelocity / 12);
                if (window.Game) window.Game.triggerScreenShake(Math.min(impactVelocity * 0.04, 0.4));
            }

            if (e.body && window.Physics) {
                window.Physics.applyKineticImpact(e.body, ballBody.velocity);
            }

            if (cannonType === 'inferno' && !ballBody.hasDetonated) {
                ballBody.hasDetonated = true;
                setTimeout(() => {
                    window.Physics.explode(ballBody.position, 6.5, 110);
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

        if (window.Game) {
            window.Game.spawnMuzzleBlast(startPos);
        }
    }
}

window.CannonController = CannonController;
