// Procedural Texture Generator for Royal Smash 3D
// Generates vibrant, cartoon-polished textures using HTML5 Canvas (Zero external assets needed!)

class TextureGenerator {
    constructor() {
        this.cache = {};
    }

    // 1. Royal Smash Icon Star Ball Texture (Blue, Red, Gold with White Stars)
    createStarBallTexture() {
        if (this.cache['star_ball']) return this.cache['star_ball'];

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Top half: Royal Blue
        ctx.fillStyle = '#1e40af';
        ctx.fillRect(0, 0, 512, 100);

        // Golden Trim Band
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(0, 100, 512, 16);

        // Center: Vibrant Carnival Crimson Red
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, 116, 512, 60);

        // Golden Trim Band
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(0, 176, 512, 16);

        // Bottom half: Deep Royal Indigo
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(0, 192, 512, 64);

        // Draw crisp White Stars across the blue sections
        ctx.fillStyle = '#ffffff';
        const drawStar = (cx, cy, spikes, outerRadius, innerRadius) => {
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            let step = Math.PI / spikes;

            ctx.beginPath();
            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerRadius);
            ctx.closePath();
            ctx.fill();
        };

        // Draw row of stars
        for (let x = 32; x < 512; x += 64) {
            drawStar(x, 50, 5, 18, 8);
            drawStar(x + 32, 224, 5, 14, 6);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        this.cache['star_ball'] = texture;
        return texture;
    }

    // 2. Glossy Toy Block Texture with Beveled Border & Embossed Icon
    createToyBlockTexture(mainColor, borderColor, symbol = 'star') {
        const key = `${mainColor}_${borderColor}_${symbol}`;
        if (this.cache[key]) return this.cache[key];

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Main background with subtle gradient highlight
        const grad = ctx.createLinearGradient(0, 0, 256, 256);
        grad.addColorStop(0, mainColor);
        grad.addColorStop(1, this.shadeColor(mainColor, -25));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);

        // Beveled Border
        ctx.lineWidth = 18;
        ctx.strokeStyle = borderColor;
        ctx.strokeRect(9, 9, 238, 238);

        // Inner soft shadow
        ctx.lineWidth = 6;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.strokeRect(20, 20, 216, 216);

        // Embossed Center Symbol
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 90px "Arial Rounded MT Bold", sans-serif';

        if (symbol === 'crown') {
            ctx.fillText('👑', 128, 128);
        } else if (symbol === 'star') {
            ctx.fillText('★', 128, 134);
        } else if (symbol === 'diamond') {
            ctx.fillText('◆', 128, 128);
        } else if (symbol === 'wood') {
            // Wood plank slats
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(20, 80, 216, 4);
            ctx.fillRect(20, 160, 216, 4);
            // Cross braces
            ctx.beginPath();
            ctx.lineWidth = 12;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
            ctx.moveTo(25, 25); ctx.lineTo(231, 231);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        this.cache[key] = texture;
        return texture;
    }

    // 3. Carnival Soda / Bowling Can Texture (with Bullseye / Stripes)
    createCanTexture(baseColor = '#ef4444') {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Metallic top and bottom
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, 0, 256, 30);
        ctx.fillRect(0, 226, 256, 30);

        // Body
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 30, 256, 196);

        // White racing stripe
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 75, 256, 35);

        // Target Bullseye
        ctx.beginPath();
        ctx.arc(128, 128, 45, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(128, 128, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(128, 128, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        return texture;
    }

    // 4. TNT Barrel Texture with Hazard Stripes
    createTNTTexture() {
        if (this.cache['tnt']) return this.cache['tnt'];

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Red body
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(0, 0, 256, 256);

        // Yellow and Black warning stripes at top and bottom
        const drawHazard = (y) => {
            ctx.fillStyle = '#facc15';
            ctx.fillRect(0, y, 256, 36);
            ctx.fillStyle = '#18181b';
            for (let x = -30; x < 280; x += 36) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 18, y);
                ctx.lineTo(x + 36, y + 36);
                ctx.lineTo(x + 18, y + 36);
                ctx.closePath();
                ctx.fill();
            }
        };

        drawHazard(15);
        drawHazard(205);

        // Bold "TNT" lettering in center
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.font = '900 80px "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText('TNT', 128, 128);
        ctx.fillText('TNT', 128, 128);

        const texture = new THREE.CanvasTexture(canvas);
        this.cache['tnt'] = texture;
        return texture;
    }

    shadeColor(color, percent) {
        let num = parseInt(color.replace('#', ''), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
}

window.Textures = new TextureGenerator();
