// Royal Smash 3D - Exact Play Store Turntable Cannon ("Toop")
// Faithfully matches screen_0.jpg, screen_1.jpg & screen_2.jpg

class CannonController {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.turntable = null;
        this.barrelPivot = null;
        this.barrel = null;
        this.loadedBallPreview = null;
        this.recoilOffset = 0;
        this.isRecoiling = false;

        // Positioned at bottom-center of the screen
        this.position = new THREE.Vector3(0, 0.1, 10.8);
        this.pitch = 0.26;
        this.yaw = 0.0;

        this.trajectoryLine = null;
        this.maxTrajectoryPoints = 48;

        this.buildTurntableCannon();
        this.buildTrajectoryVisualizer();
        this.scene.add(this.group);
    }

    buildTurntableCannon() {
        this.group.position.copy(this.position);

        // High-gloss vibrant materials matching Play Store screenshots
        const purpleMat = new THREE.MeshPhongMaterial({
            color: 0x8b2fc9,
            specular: 0xd8b4fe,
            shininess: 95
        });
        const goldMat = new THREE.MeshPhongMaterial({
            color: 0xfacc15,
            specular: 0xfef08a,
            shininess: 160
        });
        const innerYellowMat = new THREE.MeshPhongMaterial({
            color: 0xfde047,
            specular: 0xffffff,
            shininess: 85
        });
        const royalBlueMat = new THREE.MeshPhongMaterial({
            color: 0x0284c7,
            specular: 0x7dd3fc,
            shininess: 110
        });
        const gemRedMat = new THREE.MeshPhongMaterial({
            color: 0xdc2626,
            specular: 0xfca5a5,
            shininess: 140
        });

        // 1. Turntable Rotational Group
        this.turntable = new THREE.Group();
        this.group.add(this.turntable);

        // A. Outer Purple Ring (Concentric Base)
        const outerRingGeo = new THREE.CylinderGeometry(2.5, 2.65, 0.35, 36);
        const outerRing = new THREE.Mesh(outerRingGeo, purpleMat);
        outerRing.position.y = 0.18;
        outerRing.receiveShadow = true;
        this.turntable.add(outerRing);

        // B. Middle Gold Ring with Golden Pegs / Knobs
        const midGoldGeo = new THREE.CylinderGeometry(2.1, 2.1, 0.42, 36);
        const midGold = new THREE.Mesh(midGoldGeo, goldMat);
        midGold.position.y = 0.22;
        this.turntable.add(midGold);

        // 6 Golden Round Knobs around the rim (screen_0.jpg)
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.3, 16), goldMat);
            knob.position.set(Math.cos(angle) * 1.95, 0.45, Math.sin(angle) * 1.95);
            this.turntable.add(knob);
        }

        // C. Inner Yellow Turntable Disc
        const innerDiscGeo = new THREE.CylinderGeometry(1.65, 1.65, 0.48, 32);
        const innerDisc = new THREE.Mesh(innerDiscGeo, innerYellowMat);
        innerDisc.position.y = 0.25;
        this.turntable.add(innerDisc);

        // 2. Twin Royal Blue Mounting Brackets / Arms
        const armGeo = new THREE.CylinderGeometry(0.24, 0.32, 1.2, 16);
        [-0.95, 0.95].forEach(x => {
            const arm = new THREE.Mesh(armGeo, royalBlueMat);
            arm.position.set(x, 0.85, 0);
            arm.castShadow = true;

            // Golden axle cap
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16), goldMat);
            cap.rotation.z = Math.PI / 2;
            cap.position.set(x > 0 ? x + 0.12 : x - 0.12, 1.25, 0);

            this.turntable.add(arm);
            this.turntable.add(cap);
        });

        // 3. Cannon Pivot & Barrel (Elevates up and down)
        this.barrelPivot = new THREE.Group();
        this.barrelPivot.position.set(0, 1.25, 0);
        this.turntable.add(this.barrelPivot);

        // Main Flared Royal Blue Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.44, 0.58, 2.4, 28);
        this.barrel = new THREE.Mesh(barrelGeo, royalBlueMat);
        this.barrel.rotation.x = Math.PI / 2;
        this.barrel.position.z = -0.7;
        this.barrel.castShadow = true;
        this.barrelPivot.add(this.barrel);

        // Golden Collar Ring with Red Studs (screen_0.jpg)
        const collarGeo = new THREE.CylinderGeometry(0.56, 0.48, 0.42, 28);
        const collar = new THREE.Mesh(collarGeo, goldMat);
        collar.position.y = 1.15;
        this.barrel.add(collar);

        // Red Cabochon Gems around collar
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const gem = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), gemRedMat);
            gem.position.set(Math.cos(angle) * 0.54, 1.15, Math.sin(angle) * 0.54);
            this.barrel.add(gem);
        }

        // Golden Crown Emblem embossed on top of the barrel (screen_0.jpg)
        const crownGeo = new THREE.ConeGeometry(0.24, 0.28, 6);
        const crownMesh = new THREE.Mesh(crownGeo, goldMat);
        crownMesh.position.set(0, 0.6, 0.52);
        crownMesh.rotation.x = Math.PI / 4;
        this.barrel.add(crownMesh);

        // 4. Loaded Glossy Red Sphere (screen_0.jpg & screen_2.jpg)
        const ballGeo = new THREE.SphereGeometry(0.42, 24, 24);
        this.loadedBallPreview = new THREE.Mesh(ballGeo, gemRedMat);
        this.loadedBallPreview.position.set(0, 0, -2.15);
        this.barrelPivot.add(this.loadedBallPreview);

        // Muzzle Flash Light
        this.flashLight = new THREE.PointLight(0xffd700, 0, 16);
        this.flashLight.position.set(0, 0, -2.4);
        this.barrelPivot.add(this.flashLight);

        this.updateRotation();
    }

    buildTrajectoryVisualizer() {
        const positions = new Float32Array(this.maxTrajectoryPoints * 3);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.LineDashedMaterial({
            color: 0xffea00,
            dashSize: 0.35,
            gapSize: 0.2,
            linewidth: 4
        });

        this.trajectoryLine = new THREE.Line(geometry, material);
        this.trajectoryLine.frustumCulled = false;
        this.scene.add(this.trajectoryLine);
    }

    setAim(pitch, yaw) {
        this.pitch = Math.max(0.08, Math.min(pitch, 0.65));
        this.yaw = Math.max(-0.45, Math.min(yaw, 0.45));
        this.updateRotation();
        this.updateTrajectory();
    }

    updateRotation() {
        if (this.turntable) this.turntable.rotation.y = this.yaw;
        if (this.barrelPivot) this.barrelPivot.rotation.x = this.pitch;
    }

    getMuzzlePosition() {
        const muzzleLocal = new THREE.Vector3(0, 0, -2.2);
        this.barrelPivot.localToWorld(muzzleLocal);
        return muzzleLocal;
    }

    getFiringVelocity(baseSpeed = 48) {
        const dir = new THREE.Vector3(0, 0, -1);
        const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
        dir.applyEuler(euler);
        dir.normalize();
        return dir.multiplyScalar(baseSpeed);
    }

    updateTrajectory(speed = 48) {
        if (!this.trajectoryLine) return;

        const startPos = this.getMuzzlePosition();
        const velocity = this.getFiringVelocity(speed);
        const gravity = -11.5;
        const dt = 0.04;

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
            if (py < 0.2) break;
        }

        this.trajectoryLine.geometry.attributes.position.needsUpdate = true;
        this.trajectoryLine.computeLineDistances();
    }

    triggerRecoil() {
        this.isRecoiling = true;
        this.recoilOffset = 0.65;
        this.flashLight.intensity = 12;

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
            this.recoilOffset -= dt * 3.2;
            if (this.recoilOffset <= 0) {
                this.recoilOffset = 0;
                this.isRecoiling = false;
            }
            if (this.barrel) {
                this.barrel.position.z = -0.7 + this.recoilOffset;
            }
        }
    }

    fire(cannonType = 'standard', powerBonus = 1.0) {
        this.triggerRecoil();

        const isExplosive = (cannonType === 'inferno');
        if (window.Sound) window.Sound.playCannonFire(isExplosive);

        const startPos = this.getMuzzlePosition();
        const baseSpeed = (cannonType === 'dragon' ? 56 : 48) * powerBonus;

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

        let radius = 0.44;
        let color = 0xef4444; // Glossy Fire Red matching screen_1.jpg
        let specular = 0xffffff;
        let shininess = 140;

        if (cannonType === 'dragon') {
            color = 0xffd700;
            specular = 0xfffae5;
            shininess = 160;
            radius = 0.48;
        } else if (cannonType === 'inferno') {
            color = 0xff3d00;
            specular = 0xffaa00;
        } else if (cannonType === 'bouncy') {
            color = 0x00e5ff;
            specular = 0x80d8ff;
        }

        const ballGeo = new THREE.SphereGeometry(radius, 24, 24);
        const ballMat = new THREE.MeshPhongMaterial({
            color: color,
            specular: specular,
            shininess: shininess
        });
        const ballMesh = new THREE.Mesh(ballGeo, ballMat);
        ballMesh.castShadow = true;
        this.scene.add(ballMesh);

        // Golden Glowing Corona Aura (screen_1.jpg)
        const auraGeo = new THREE.SphereGeometry(radius * 1.35, 16, 16);
        const auraMat = new THREE.MeshBasicMaterial({
            color: 0xfacc15,
            transparent: true,
            opacity: 0.45
        });
        const auraMesh = new THREE.Mesh(auraGeo, auraMat);
        ballMesh.add(auraMesh);

        let mass = 15.0;
        if (cannonType === 'dragon') mass = 30.0;
        if (cannonType === 'bouncy') mass = 8.0;

        const ballShape = new CANNON.Sphere(radius);
        const ballBody = new CANNON.Body({
            mass: mass,
            material: window.Physics.ballMaterial,
            position: new CANNON.Vec3(startPos.x, startPos.y, startPos.z)
        });
        ballBody.addShape(ballShape);
        ballBody.velocity.set(velVec.x, velVec.y, velVec.z);

        if (cannonType === 'bouncy') {
            ballBody.material.restitution = 0.94;
        }

        ballBody.addEventListener('collide', (e) => {
            const impactVelocity = e.contact.getImpactVelocityAlongNormal();
            if (impactVelocity > 2.0 && window.Sound) {
                window.Sound.playImpact(impactVelocity / 12);
                if (window.Game) window.Game.triggerScreenShake(Math.min(impactVelocity * 0.04, 0.4));
            }

            // High-Impact Kinetic Impulse Transfer
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

        // Fiery Muzzle Blast (screen_1.jpg)
        if (window.Game) {
            window.Game.spawnMuzzleBlast(startPos);
        }
    }
}

window.CannonController = CannonController;
