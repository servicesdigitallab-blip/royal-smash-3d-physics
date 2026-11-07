// Royal Smash 3D - High-Energy Destruction Physics (Cannon.js)
// Solves collision orientations, kinetic impulse transfers, and realistic domino collapses

class PhysicsManager {
    constructor() {
        this.world = null;
        this.bodies = [];
        this.meshes = [];
        this.destructibleBodies = [];
        this.activeBalls = [];

        this.groundMaterial = null;
        this.blockMaterial = null;
        this.stoneMaterial = null;
        this.tntMaterial = null;
        this.jarMaterial = null;
        this.ballMaterial = null;

        this.initWorld();
    }

    initWorld() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -11.5, 0); // Crisp, punchy gravity
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 20; // High precision solver
        this.world.defaultContactMaterial.contactEquationStiffness = 1e8;
        this.world.defaultContactMaterial.contactEquationRelaxation = 2.5;

        // Materials
        this.groundMaterial = new CANNON.Material("ground");
        this.blockMaterial = new CANNON.Material("block");
        this.stoneMaterial = new CANNON.Material("stone");
        this.tntMaterial = new CANNON.Material("tnt");
        this.jarMaterial = new CANNON.Material("jar");
        this.ballMaterial = new CANNON.Material("ball");

        // Contact materials (Low friction for dramatic slides & tumbling)
        const ballBlockContact = new CANNON.ContactMaterial(this.ballMaterial, this.blockMaterial, {
            friction: 0.15,
            restitution: 0.5
        });
        const ballStoneContact = new CANNON.ContactMaterial(this.ballMaterial, this.stoneMaterial, {
            friction: 0.2,
            restitution: 0.4
        });
        const blockBlockContact = new CANNON.ContactMaterial(this.blockMaterial, this.blockMaterial, {
            friction: 0.25, // Blocks slide and topple naturally
            restitution: 0.15
        });
        const blockGroundContact = new CANNON.ContactMaterial(this.blockMaterial, this.groundMaterial, {
            friction: 0.4,
            restitution: 0.18
        });
        const stoneGroundContact = new CANNON.ContactMaterial(this.stoneMaterial, this.groundMaterial, {
            friction: 0.5,
            restitution: 0.12
        });

        this.world.addContactMaterial(ballBlockContact);
        this.world.addContactMaterial(ballStoneContact);
        this.world.addContactMaterial(blockBlockContact);
        this.world.addContactMaterial(blockGroundContact);
        this.world.addContactMaterial(stoneGroundContact);
    }

    clear() {
        for (let b of this.bodies) {
            this.world.remove(b);
        }
        this.bodies = [];
        this.meshes = [];
        this.destructibleBodies = [];
        this.activeBalls = [];
    }

    step(dt) {
        if (!this.world) return;
        this.world.step(1 / 60, dt, 5);

        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            const mesh = this.meshes[i];
            if (mesh && body) {
                mesh.position.copy(body.position);
                mesh.quaternion.copy(body.quaternion);
            }
        }

        // Clean out-of-bounds or old balls
        for (let i = this.activeBalls.length - 1; i >= 0; i--) {
            const ball = this.activeBalls[i];
            if (ball.body.position.y < -15 || ball.lifeTime > 8) {
                this.removeBody(ball.body, ball.mesh);
                this.activeBalls.splice(i, 1);
            } else {
                ball.lifeTime += dt;
            }
        }
    }

    addPair(body, mesh, isDestructible = false, meta = {}) {
        this.world.addBody(body);
        this.bodies.push(body);
        this.meshes.push(mesh);
        body.gameMeta = meta;

        if (isDestructible) {
            this.destructibleBodies.push({
                body: body,
                mesh: mesh,
                originalY: body.position.y,
                type: meta.type || 'wood',
                destroyed: false,
                points: meta.points || 15
            });
        }
    }

    removeBody(body, mesh) {
        const idx = this.bodies.indexOf(body);
        if (idx !== -1) {
            this.world.remove(body);
            this.bodies.splice(idx, 1);
            this.meshes.splice(idx, 1);
        }
        if (mesh && mesh.parent) {
            mesh.parent.remove(mesh);
        }
    }

    // High-Impact Kinetic Impulse Transfer on direct Cannonball hit
    applyKineticImpact(targetBody, ballVelocity) {
        if (!targetBody || targetBody.mass === 0) return;

        const dir = ballVelocity.clone();
        dir.normalize();
        dir.y += 0.25; // Upward trajectory pop
        dir.normalize();

        // Punchy forward impulse force
        const force = Math.min(targetBody.mass * 55, 140);
        const impulse = dir.scale(force);
        targetBody.applyImpulse(impulse, targetBody.position);
        targetBody.wakeUp();
    }

    // Explosive Radial Detonation (TNT)
    explode(epicenter, radius = 7.5, maxForce = 130) {
        if (window.Sound) window.Sound.playExplosion();
        if (window.Game) window.Game.spawnExplosionFX(epicenter);

        const epicVec = new CANNON.Vec3(epicenter.x, epicenter.y, epicenter.z);

        for (let body of this.bodies) {
            if (body.mass === 0) continue;

            const diff = body.position.vsub(epicVec);
            const dist = diff.length();

            if (dist < radius && dist > 0.05) {
                diff.normalize();
                const forceFactor = (1 - (dist / radius)) * maxForce;
                diff.y += 0.6; // Dramatic upward blast
                diff.normalize();

                const impulse = diff.scale(forceFactor * body.mass * 0.9);
                body.applyImpulse(impulse, body.position);
                body.wakeUp();
            }
        }
    }
}

window.Physics = new PhysicsManager();
