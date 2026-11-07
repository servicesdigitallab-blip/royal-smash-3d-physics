// Procedural Ultra-Vibrant Texture Generator for Royal Smash 3D
// Generates crisp, colorful casual-game textures using HTML5 Canvas

class TextureGenerator {
    constructor() {
        this.cache = {};
    }

    // 1. Royal Smash Icon Star Ball Texture (High-contrast Blue, Red, Yellow & Stars)
    createStarBallTexture() {
        if (this.cache['star_ball']) return this.cache['star_ball'];

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Top Crown: Rich Royal Blue
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(0, 0, 512, 85);

        // Bright Yellow/Gold Band
        ctx.fillStyle = '#fde047';
        ctx.fillRect(0, 85, 512, 22);

        // Center: Vibrant Fire Red Equator
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(0, 107, 512, 60);

        // Bright Yellow/Gold Band
        ctx.fillStyle = '#fde047';
        ctx.fillRect(0, 167, 512, 22);

        // Bottom: Deep Royal Blue
        ctx.fillStyle = '#1e40af';
        ctx.fillRect(0, 189, 512, 67);

        // Crisp White Stars across the Blue and Red sections
        const drawStar = (cx, cy, spikes, outerRadius, innerRadius, color = '#ffffff') => {
            let rot = Math.PI / 2 * 3;
            let step = Math.PI / spikes;

            ctx.beginPath();
            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
                rot += step;
                ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
                rot += step;
            }
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        };

        // Draw stars along the top blue band
        for (let x = 32; x < 512; x += 64) {
            drawStar(x, 42, 5, 20, 9, '#ffffff');
            drawStar(x, 42, 5, 20, 9, 'rgba(255,255,255,0.9)');
        }

        // Draw golden mini-stars along the center red band
        for (let x = 64; x < 512; x += 64) {
            drawStar(x, 137, 5, 15, 7, '#fef08a');
        }

        // Draw stars along the bottom blue band
        for (let x = 32; x < 512; x += 64) {
            drawStar(x + 32, 222, 5, 16, 7, '#ffffff');
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        this.cache['star_ball'] = texture;
        return texture;
    }

    // 2. Carnival Knockdown Can Texture (Red & Blue with Bullseye and Silver Rims)
    createCanTexture(baseColor = '#ef4444') {
        const key = `can_${baseColor}`;
        if (this.cache[key]) return this.cache[key];

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Shiny Chrome Metal Rims (top & bottom)
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, 0, 256, 28);
        ctx.fillRect(0, 228, 256, 28);

        // Chrome bevel highlight
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 12, 256, 6);
        ctx.fillRect(0, 238, 256, 6);

        // Vibrant Body
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 28, 256, 200);

        // White Center Target Band
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 80, 256, 40);

        // Target Bullseye Circles
        const drawBullseye = (cx, cy) => {
            ctx.beginPath();
            ctx.arc(cx, cy, 50, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy, 35, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy, 20, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
        };

        drawBullseye(64, 128);
        drawBullseye(192, 128);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        this.cache[key] = texture;
        return texture;
    }

    // 3. High-Contrast Hazard TNT Barrel Texture
    createTNTTexture() {
        if (this.cache['tnt']) return this.cache['tnt'];

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Bright Crimson Red Barrel Body
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, 0, 256, 256);

        // Yellow and Black Diagonal Hazard Stripes
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

        // Bold Embossed "TNT" Lettering
        ctx.fillStyle = '#000000';
        ctx.font = '900 84px "Arial Black", Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TNT', 131, 131); // Shadow

        ctx.fillStyle = '#ffffff';
        ctx.fillText('TNT', 128, 128);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        this.cache['tnt'] = texture;
        return texture;
    }
}

window.Textures = new TextureGenerator();
