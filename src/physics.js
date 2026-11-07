// Physics Simulation Manager using Cannon.js
// Handles rigid bodies, contact physics, collisions, materials, and explosions

class PhysicsManager {
    constructor() {
        this.world = null;
        this.bodies = [];
        this.meshes = [];
        this.tntBodies = [];
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
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 15;
        this.world.defaultContactMaterial.contactEquationStiffness = 1e7;
        this.world.defaultContactMaterial.contactEquationRelaxation = 4;

        // Define Materials
        this.groundMaterial = new CANNON.Material("ground");
        this.blockMaterial = new CANNON.Material("block");
        this.stoneMaterial = new CANNON.Material("stone");
        this.tntMaterial = new CANNON.Material("tnt");
        this.jarMaterial = new CANNON.Material("jar");
        this.ballMaterial = new CANNON.Material("ball");

        // Contact Material configurations
        const ballBlockContact = new CANNON.ContactMaterial(this.ballMaterial, this.blockMaterial, {
            friction: 0.35,
            restitution: 0.35
        });
        const ballStoneContact = new CANNON.ContactMaterial(this.ballMaterial, this.stoneMaterial, {
            friction: 0.4,
            restitution: 0.25
        });
        const blockBlockContact = new CANNON.ContactMaterial(this.blockMaterial, this.blockMaterial, {
            friction: 0.6,
            restitution: 0.1
        });
        const blockGroundContact = new CANNON.ContactMaterial(this.blockMaterial, this.groundMaterial, {
            friction: 0.7,
            restitution: 0.12
        });
        const stoneGroundContact = new CANNON.ContactMaterial(this.stoneMaterial, this.groundMaterial, {
            friction: 0.8,
            restitution: 0.08
        });

        this.world.addContactMaterial(ballBlockContact);
        this.world.addContactMaterial(ballStoneContact);
        this.world.addContactMaterial(blockBlockContact);
        this.world.addContactMaterial(blockGroundContact);
        this.world.addContactMaterial(stoneGroundContact);
    }

    clear() {
        // Remove all current bodies
        for (let b of this.bodies) {
            this.world.remove(b);
        }
        this.bodies = [];
        this.meshes = [];
        this.tntBodies = [];
        this.destructibleBodies = [];
        this.activeBalls = [];
    }

    step(dt) {
        if (!this.world) return;
        this.world.step(1 / 60, dt, 3);

        // Sync Cannon.js bodies with Three.js meshes
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            const mesh = this.meshes[i];
            if (mesh && body) {
                mesh.position.copy(body.position);
                mesh.quaternion.copy(body.quaternion);
            }
        }

        // Clean up balls that fall out of bounds
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
                points: meta.points || 10
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

    // Trigger explosive radial force (TNT Barrel detonation)
    explode(epicenter, radius = 5.5, maxForce = 75) {
        if (window.Sound) window.Sound.playExplosion();
        if (window.Game) window.Game.spawnExplosionFX(epicenter);

        const epicVec = new CANNON.Vec3(epicenter.x, epicenter.y, epicenter.z);

        for (let body of this.bodies) {
            if (body.mass === 0) continue; // Skip static floor

            const diff = body.position.vsub(epicVec);
            const dist = diff.length();

            if (dist < radius && dist > 0.05) {
                diff.normalize();
                // Inverse distance force falloff
                const forceFactor = (1 - (dist / radius)) * maxForce;
                // Add an upward trajectory bias for cinematic block scattering
                diff.y += 0.45;
                diff.normalize();

                const impulse = diff.scale(forceFactor * body.mass * 0.75);
                body.applyImpulse(impulse, body.position);
                body.wakeUp();
            }
        }
    }
}

window.Physics = new PhysicsManager();
