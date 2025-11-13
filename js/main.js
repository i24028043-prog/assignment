// Three.js 3D 背景效果
let scene, camera, renderer, particles;
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

function initThree() {
    // 创建场景
    scene = new THREE.Scene();
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    camera.position.z = 1000;
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ 
        alpha: true,
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    const container = document.getElementById('three-container');
    container.appendChild(renderer.domElement);
    
    // 创建粒子系统
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const color1 = new THREE.Color(0xffaae1);
    const color2 = new THREE.Color(0xffc0e8);
    const color3 = new THREE.Color(0xffe0f0);
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // 随机位置
        positions[i3] = (Math.random() - 0.5) * 2000;
        positions[i3 + 1] = (Math.random() - 0.5) * 2000;
        positions[i3 + 2] = (Math.random() - 0.5) * 2000;
        
        // 随机颜色
        const colorChoice = Math.random();
        let color;
        if (colorChoice < 0.33) {
            color = color1;
        } else if (colorChoice < 0.66) {
            color = color2;
        } else {
            color = color3;
        }
        
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 5,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // 添加鼠标移动监听
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    
    // 窗口大小改变监听
    window.addEventListener('resize', onWindowResize, false);
    
    // 开始动画循环
    animate();
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 0.1;
    mouseY = (event.clientY - windowHalfY) * 0.1;
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    // 旋转粒子系统
    if (particles) {
        particles.rotation.x += 0.0005;
        particles.rotation.y += 0.001;
        
        // 根据鼠标位置调整旋转
        particles.rotation.x += (mouseY - particles.rotation.x) * 0.01;
        particles.rotation.y += (mouseX - particles.rotation.y) * 0.01;
    }
    
    // 移动相机创建视差效果
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);
    
    renderer.render(scene, camera);
}

// 页面加载完成后初始化
window.addEventListener('load', () => {
    initThree();
});

// 文字粒子系统
let textParticleCanvas, textParticleCtx;
let textParticles = [];
let isDisintegrating = false;
let isReforming = false;
let animationPhase = 0; // 0: 显示, 1: 逸散, 2: 隐藏, 3: 重组

class TextParticle {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.originalX = x;
        this.originalY = y;
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.92;
        this.spring = 0.15;
        this.size = Math.random() * 3 + 2;
        this.color = `rgba(255, ${170 + Math.random() * 85}, ${225 + Math.random() * 30}, 1)`;
        this.relativeX = 0;
        this.relativeY = 0;
        this.elementId = '';
    }
    
    update(disintegrate) {
        if (disintegrate) {
            // 逸散效果 - 从中心向外扩散
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const dx = this.x - centerX;
            const dy = this.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            // 向外推的力
            const force = 0.3;
            this.vx += Math.cos(angle) * force;
            this.vy += Math.sin(angle) * force;
            
            // 添加随机扰动
            this.vx += (Math.random() - 0.5) * 3;
            this.vy += (Math.random() - 0.5) * 3;
        } else {
            // 重组效果 - 回到目标位置
            const element = document.getElementById(this.elementId);
            if (element) {
                const rect = element.getBoundingClientRect();
                this.targetX = rect.left + rect.width / 2 + this.relativeX;
                this.targetY = rect.top + rect.height / 2 + this.relativeY;
            }
            
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 1) {
                this.vx += dx * this.spring;
                this.vy += dy * this.spring;
            } else {
                // 已经到达目标位置，减速
                this.vx *= 0.8;
                this.vy *= 0.8;
            }
        }
        
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        this.x += this.vx;
        this.y += this.vy;
    }
    
    draw() {
        const alpha = Math.min(1, Math.max(0.3, 1 - Math.abs(this.vx) / 10 - Math.abs(this.vy) / 10));
        textParticleCtx.fillStyle = this.color.replace('1)', `${alpha})`);
        textParticleCtx.beginPath();
        textParticleCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        textParticleCtx.fill();
        
        // 添加光晕效果
        const gradient = textParticleCtx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size * 2
        );
        gradient.addColorStop(0, this.color.replace('1)', '0.8)'));
        gradient.addColorStop(1, this.color.replace('1)', '0)'));
        textParticleCtx.fillStyle = gradient;
        textParticleCtx.beginPath();
        textParticleCtx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        textParticleCtx.fill();
    }
}

function initTextParticles() {
    textParticleCanvas = document.getElementById('text-particle-canvas');
    textParticleCtx = textParticleCanvas.getContext('2d');
    
    textParticleCanvas.width = window.innerWidth;
    textParticleCanvas.height = window.innerHeight;
    
    createTextParticles();
    animateTextParticles();
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        textParticleCanvas.width = window.innerWidth;
        textParticleCanvas.height = window.innerHeight;
        createTextParticles();
    });
}

function createTextParticles() {
    textParticles = [];
    const title = document.getElementById('main-title');
    const subtitle = document.getElementById('sub-title');
    
    if (!title || !subtitle) return;
    
    // 为主标题创建粒子
    createParticlesForElement(title);
    
    // 为副标题创建粒子
    createParticlesForElement(subtitle);
}

function createParticlesForElement(element) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    
    const style = window.getComputedStyle(element);
    const fontSize = parseInt(style.fontSize);
    const fontFamily = style.fontFamily.split(',')[0].replace(/['"]/g, ''); // 获取第一个字体
    const text = element.textContent;
    
    // 创建临时canvas来获取文字像素数据
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = Math.max(rect.width, 200);
    tempCanvas.height = Math.max(rect.height, 50);
    
    // 设置字体
    tempCtx.font = `bold ${fontSize}px ${fontFamily}`;
    tempCtx.fillStyle = '#fff';
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);
    
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    
    const particleDensity = 4; // 粒子密度（数值越小，粒子越多）
    const gap = particleDensity;
    
    for (let y = 0; y < tempCanvas.height; y += gap) {
        for (let x = 0; x < tempCanvas.width; x += gap) {
            const index = (y * tempCanvas.width + x) * 4;
            const alpha = data[index + 3];
            
            if (alpha > 100) { // 降低阈值以获取更多粒子
                const particleX = rect.left + (x - tempCanvas.width / 2 + rect.width / 2);
                const particleY = rect.top + (y - tempCanvas.height / 2 + rect.height / 2);
                
                // 存储元素信息以便重组时使用
                const particle = new TextParticle(
                    particleX,
                    particleY,
                    particleX,
                    particleY
                );
                particle.elementId = element.id;
                particle.relativeX = x - tempCanvas.width / 2;
                particle.relativeY = y - tempCanvas.height / 2;
                textParticles.push(particle);
            }
        }
    }
}

function animateTextParticles() {
    textParticleCtx.clearRect(0, 0, textParticleCanvas.width, textParticleCanvas.height);
    
    const title = document.getElementById('main-title');
    const subtitle = document.getElementById('sub-title');
    
    if (!title || !subtitle) {
        requestAnimationFrame(animateTextParticles);
        return;
    }
    
    // 检测动画阶段
    const titleStyle = window.getComputedStyle(title);
    const titleOpacity = parseFloat(titleStyle.opacity);
    const titleVisibility = titleStyle.visibility;
    
    // 根据CSS动画的opacity变化来控制粒子效果
    if (titleOpacity < 0.1 && titleVisibility === 'hidden' && !isDisintegrating && !isReforming) {
        // 文字开始消失，触发逸散效果
        if (textParticles.length === 0) {
            createTextParticles();
        }
        isDisintegrating = true;
        isReforming = false;
        animationPhase = 1;
    } else if (titleOpacity > 0.1 && titleOpacity < 0.9 && titleVisibility === 'visible' && !isDisintegrating && !isReforming) {
        // 文字开始出现，准备重组
        if (textParticles.length === 0) {
            createTextParticles();
        }
        isDisintegrating = false;
        isReforming = true;
        animationPhase = 3;
    } else if (titleOpacity > 0.9 && titleVisibility === 'visible' && isReforming) {
        // 重组完成，粒子可以继续存在但不再移动
        // 保持重组状态直到下次逸散
    }
    
    // 更新和绘制粒子
    if (textParticles.length > 0) {
        // 更新粒子位置
        textParticles.forEach((particle, index) => {
            particle.update(isDisintegrating);
            particle.draw();
        });
        
        // 移除已经逸散太远的粒子（只在逸散时）
        if (isDisintegrating) {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            textParticles = textParticles.filter(particle => {
                const dx = particle.x - centerX;
                const dy = particle.y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance < 2000; // 保留在屏幕范围内的粒子
            });
        }
    } else if (isReforming) {
        // 如果重组时没有粒子，重新创建
        createTextParticles();
    }
    
    requestAnimationFrame(animateTextParticles);
}

// 添加额外的交互效果
document.addEventListener('DOMContentLoaded', () => {
    // 为角色图片添加点击动画
    const characterItems = document.querySelectorAll('.character-item');
    characterItems.forEach(item => {
        item.addEventListener('click', function() {
            this.style.animation = 'none';
            setTimeout(() => {
                this.style.animation = '';
            }, 10);
        });
    });
    
    // 初始化文字粒子系统
    setTimeout(() => {
        initTextParticles();
    }, 500);
    
    // 定期更新粒子目标位置（用于重组）
    setInterval(() => {
        if (isReforming && textParticles.length > 0) {
            textParticles.forEach(particle => {
                const element = document.getElementById(particle.elementId);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    particle.targetX = rect.left + rect.width / 2 + particle.relativeX;
                    particle.targetY = rect.top + rect.height / 2 + particle.relativeY;
                }
            });
        }
    }, 100);
});

