// Royal Cannon ("Toop") System - MeshPhongMaterial & High-Energy Ball Physics

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
        this.maxTrajectoryPoints = 45;

        this.buildCannonMesh();
        this.buildTrajectoryVisualizer();
        this.scene.add(this.group);
    }

    buildCannonMesh() {
        this.group.position.copy(this.position);

        // Glossy vibrant materials
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
            shininess: 140
        });
        const darkWoodMat = new THREE.MeshPhongMaterial({
            color: 0x451a03,
            specular: 0x78350f,
            shininess: 50
        });

        // 1. Carriage Base (Red & Gold)
        const baseGeo = new THREE.BoxGeometry(1.5, 0.45, 1.9);
        const baseMesh = new THREE.Mesh(baseGeo, royalRedMat);
        baseMesh.position.y = 0.25;
        baseMesh.castShadow = true;
        this.group.add(baseMesh);

        // Gold Trim
        const trimGeo = new THREE.BoxGeometry(1.56, 0.1, 1.96);
        const trimMesh = new THREE.Mesh(trimGeo, goldMat);
        trimMesh.position.y = 0.48;
        this.group.add(trimMesh);

        // 2. Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.58, 0.58, 0.24, 18);
        [-0.88, 0.88].forEach(x => {
            const wheel = new THREE.Mesh(wheelGeo, darkWoodMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, 0.45, 0);
            wheel.castShadow = true;

            const rim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.05, 8, 20), goldMat);
            rim.rotation.y = Math.PI / 2;
            rim.position.set(x, 0.45, 0);

            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.28, 12), goldMat);
            hub.rotation.z = Math.PI / 2;
            hub.position.set(x, 0.45, 0);

            this.group.add(wheel);
            this.group.add(rim);
            this.group.add(hub);
        });

        // 3. Barrel & Crown Muzzle
        this.barrelPivot = new THREE.Group();
        this.barrelPivot.position.set(0, 0.75, 0);
        this.group.add(this.barrelPivot);

        const barrelGeo = new THREE.CylinderGeometry(0.36, 0.48, 2.3, 24);
        this.barrel = new THREE.Mesh(barrelGeo, royalBlueMat);
        this.barrel.rotation.x = Math.PI / 2;
        this.barrel.position.z = -0.7;
        this.barrel.castShadow = true;
        this.barrelPivot.add(this.barrel);

        // Golden Middle Ring
        const midRing = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.06, 12, 24), goldMat);
        midRing.position.y = 0.2;
        this.barrel.add(midRing);

        // Golden Crown Muzzle Battlements
        const crownMuzzle = new THREE.Mesh(new THREE.TorusGeometry(0.40, 0.08, 12, 24), goldMat);
        crownMuzzle.position.y = 1.15;
        this.barrel.add(crownMuzzle);

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const spikeGeo = new THREE.ConeGeometry(0.08, 0.22, 6);
            const spike = new THREE.Mesh(spikeGeo, goldMat);
            spike.position.set(Math.cos(angle) * 0.40, 1.25, Math.sin(angle) * 0.40);
            spike.rotation.z = -Math.cos(angle) * 0.3;
            spike.rotation.x = Math.sin(angle) * 0.3;
            this.barrel.add(spike);
        }

        // Breech Ball
        const breechBall = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 16), goldMat);
        breechBall.position.y = -1.15;
        this.barrel.add(breechBall);

        // 4. Golden Spring
        const springGroup = new THREE.Group();
        for (let c = 0; c < 5; c++) {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 8, 16), goldMat);
            ring.position.y = (c - 2) * 0.14;
            springGroup.add(ring);
        }
        springGroup.position.set(0, 0, -1.6);
        this.barrelPivot.add(springGroup);
        this.spring = springGroup;

        // 5. Loaded Star Ball Preview
        const starTexture = window.Textures ? window.Textures.createStarBallTexture() : null;
        const ballMat = new THREE.MeshPhongMaterial({
            map: starTexture,
            specular: 0xffffff,
            shininess: 120
        });
        this.loadedBallPreview = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 24), ballMat);
        this.loadedBallPreview.position.set(0, 0, -2.15);
        this.barrelPivot.add(this.loadedBallPreview);

        // Flash Light
        this.flashLight = new THREE.PointLight(0xffea00, 0, 12);
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

    getFiringVelocity(baseSpeed = 44) {
        const dir = new THREE.Vector3(0, 0, -1);
        dir.applyEuler(this.barrelPivot.rotation);
        dir.normalize();
        return dir.multiplyScalar(baseSpeed);
    }

    updateTrajectory(speed = 44) {
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
        this.recoilOffset = 0.6;
        this.springSquash = 1.5;
        this.flashLight.intensity = 8;

        if (this.loadedBallPreview) {
            this.loadedBallPreview.visible = false;
            setTimeout(() => {
                if (this.loadedBallPreview) this.loadedBallPreview.visible = true;
            }, 450);
        }

        setTimeout(() => {
            if (this.flashLight) this.flashLight.intensity = 0;
        }, 80);

        if (window.Game) window.Game.triggerScreenShake(0.4);
    }

    update(dt) {
        if (this.isRecoiling) {
            this.recoilOffset -= dt * 3.0;
            if (this.recoilOffset <= 0) {
                this.recoilOffset = 0;
                this.isRecoiling = false;
            }
            if (this.barrel) {
                this.barrel.position.z = -0.7 + this.recoilOffset;
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
        const baseSpeed = (cannonType === 'dragon' ? 52 : 44) * powerBonus;

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

        let mass = 12.0;
        if (cannonType === 'dragon') mass = 26.0;
        if (cannonType === 'bouncy') mass = 7.0;

        const ballShape = new CANNON.Sphere(radius);
        const ballBody = new CANNON.Body({
            mass: mass,
            material: window.Physics.ballMaterial,
            position: new CANNON.Vec3(startPos.x, startPos.y, startPos.z)
        });
        ballBody.addShape(ballShape);
        ballBody.velocity.set(velVec.x, velVec.y, velVec.z);

        // Rapid 3D Spin in Flight!
        ballBody.angularVelocity.set(
            (Math.random() - 0.5) * 20,
            Math.random() * 25 + 15,
            (Math.random() - 0.5) * 20
        );

        if (cannonType === 'bouncy') {
            ballBody.material.restitution = 0.94;
        }

        // Direct Kinetic Punch Collision Listener!
        ballBody.addEventListener('collide', (e) => {
            const impactVelocity = e.contact.getImpactVelocityAlongNormal();
            if (impactVelocity > 2.0 && window.Sound) {
                window.Sound.playImpact(impactVelocity / 12);
                if (window.Game) window.Game.triggerScreenShake(Math.min(impactVelocity * 0.04, 0.35));
            }

            // Punchy impulse transfer to the hit body!
            if (e.body && window.Physics) {
                window.Physics.applyKineticImpact(e.body, ballBody.velocity);
            }

            if (cannonType === 'inferno' && !ballBody.hasDetonated) {
                ballBody.hasDetonated = true;
                setTimeout(() => {
                    window.Physics.explode(ballBody.position, 6.5, 100);
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
