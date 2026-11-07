// Procedural Texture Generator - Exact Replica of Royal Smash Play Store Assets

class TextureGenerator {
    constructor() {
        this.cache = {};
    }

    // 1. Blue Wave Carnival Can (Exact match to screen_0.jpg!)
    createWaveCanTexture() {
        if (this.cache['wave_can']) return this.cache['wave_can'];

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Shiny Chrome Metal Rims (top & bottom)
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, 0, 512, 28);
        ctx.fillRect(0, 228, 512, 28);

        // Highlight shine on metal
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 10, 512, 6);
        ctx.fillRect(0, 238, 512, 6);

        // Vibrant Glossy Royal Blue Body
        const grad = ctx.createLinearGradient(0, 28, 0, 228);
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(0.5, '#0284c7');
        grad.addColorStop(1, '#0369a1');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 28, 512, 200);

        // Iconic White Wave Ribbon across the middle (screen_0.jpg)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, 128);
        for (let x = 0; x <= 512; x += 10) {
            const y = 128 + Math.sin(x * (Math.PI * 4 / 512)) * 32;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(512, 158);
        for (let x = 512; x >= 0; x -= 10) {
            const y = 158 + Math.sin(x * (Math.PI * 4 / 512)) * 32;
            ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Wave cyan shadow
        ctx.fillStyle = '#bae6fd';
        ctx.beginPath();
        ctx.moveTo(0, 138);
        for (let x = 0; x <= 512; x += 10) {
            const y = 138 + Math.sin(x * (Math.PI * 4 / 512)) * 32;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(512, 148);
        for (let x = 512; x >= 0; x -= 10) {
            const y = 148 + Math.sin(x * (Math.PI * 4 / 512)) * 32;
            ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        this.cache['wave_can'] = texture;
        return texture;
    }

    // 2. Candy Striped Lid Texture for Jam/Paint Jars (screen_1.jpg & screen_2.jpg)
    createStripedLidTexture(stripeColor = '#ef4444') {
        const key = `lid_${stripeColor}`;
        if (this.cache[key]) return this.cache[key];

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 128);

        // Vertical candy stripes
        ctx.fillStyle = stripeColor;
        for (let x = 0; x < 256; x += 32) {
            ctx.fillRect(x, 0, 16, 128);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        this.cache[key] = texture;
        return texture;
    }

    // 3. Golden Crown Toy Block Texture (screen_2.jpg)
    createGoldenCrownBlockTexture() {
        if (this.cache['gold_crown_block']) return this.cache['gold_crown_block'];

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Bright Yellow/Gold Gradient
        const grad = ctx.createLinearGradient(0, 0, 256, 256);
        grad.addColorStop(0, '#fde047');
        grad.addColorStop(1, '#eab308');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);

        // Beveled Border
        ctx.lineWidth = 22;
        ctx.strokeStyle = '#ca8a04';
        ctx.strokeRect(11, 11, 234, 234);

        ctx.lineWidth = 6;
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(24, 24, 208, 208);

        // Embossed Golden Crown
        ctx.fillStyle = '#92400e';
        ctx.font = 'bold 96px "Arial Rounded MT Bold", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👑', 130, 132); // Shadow

        ctx.fillStyle = '#ffffff';
        ctx.fillText('👑', 128, 128);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        this.cache['gold_crown_block'] = texture;
        return texture;
    }

    // 4. TNT Barrel Hazard Texture
    createTNTTexture() {
        if (this.cache['tnt']) return this.cache['tnt'];

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, 0, 256, 256);

        const drawHazard = (y) => {
            ctx.fillStyle = '#facc15';
            ctx.fillRect(0, y, 256, 40);
            ctx.fillStyle = '#18181b';
            for (let x = -40; x < 290; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 20, y);
                ctx.lineTo(x + 40, y + 40);
                ctx.lineTo(x + 20, y + 40);
                ctx.closePath();
                ctx.fill();
            }
        };

        drawHazard(10);
        drawHazard(206);

        ctx.fillStyle = '#000000';
        ctx.font = '900 84px "Arial Black", Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TNT', 131, 131);

        ctx.fillStyle = '#ffffff';
        ctx.fillText('TNT', 128, 128);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        this.cache['tnt'] = texture;
        return texture;
    }
}

window.Textures = new TextureGenerator();
