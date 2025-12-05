class GeometryDash {
    constructor() {
        console.log('🎮 GeometryDash constructor called');

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        window.game = this;

        if (!this.canvas) {
            console.error('❌ Canvas not found!');
            return;
        }

        this.setupMobile();
        this.setupAudio();
        this.setupCanvas();
        this.initGame();

        this.highScore = localStorage.getItem('geometryDashHighScore') || 0;
        if (this.highScoreElement) {
            this.highScoreElement.textContent = `🏆 Рекорд: ${this.highScore}`;
        }

        setTimeout(() => {
            this.setupEventListeners();
            this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }, 100);

        console.log('✅ Game initialized for mobile');
    }

    jump() {
        console.log('🎮 JUMP METHOD CALLED, gameState:', this.gameState);

        if (this.gameState !== 'playing') {
            console.log('⚠️ Cannot jump: game not playing');
            return;
        }

        if (!this.player.isJumping) {
            console.log('✅ Player jumps!');
            this.player.velocityY = this.jumpForce;
            this.player.isJumping = true;
            this.player.rotation = -25;
            this.player.scale = 0.8;
            this.player.mouthOpen = true;

            // Эффекты прыжка
            this.createParticleEffect(this.player.x + this.player.width/2,
                                     this.player.y + this.player.height,
                                     8, '#FFFFFF');
            this.playSound('jump');

            setTimeout(() => {
                this.player.mouthOpen = false;
            }, 200);

            setTimeout(() => {
                this.player.scale = 1;
            }, 100);
        } else {
            console.log('⚠️ Player already jumping');
        }
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.ground.y = this.canvas.height - 120;
        });
    }

    initGame() {
        this.gameState = 'menu';
        this.score = 0;
        this.gameSpeed = 8;
        this.gravity = 0.9;
        this.jumpForce = -18;
        this.combo = 0;
        this.multiplier = 1;
        this.screenShake = 0;

        this.player = {
            x: 100,
            y: this.canvas.height - 180,
            width: 45,
            height: 45,
            velocityY: 0,
            isJumping: false,
            rotation: 0,
            scale: 1,
            color: '#FF6B6B',
            trail: [],
            mouthOpen: false,
            mouthTimer: 0,
            mouthCycle: 0,
            // Новые свойства для улучшенного персонажа
            eyeSparkle: 0,
            happy: 0
        };

        this.obstacles = [];
        this.obstacleTimer = 0;
        this.obstacleInterval = 70;
        this.particles = [];
        this.effects = [];
        this.collectibles = [];
        this.sunRays = []; // Лучи солнца

        this.ground = {
            y: this.canvas.height - 120,
            height: 120
        };

        // Цветовые темы
        this.colorThemes = [
            { primary: '#FF6B6B', secondary: '#4ECDC4', bg: '#64B5F6', sun: '#FFEB3B', ray: '#FFF59D' },
            { primary: '#FF9E6B', secondary: '#6BFFD3', bg: '#a18cd1', sun: '#FFD54F', ray: '#FFECB3' },
            { primary: '#6B83FF', secondary: '#FF6BE8', bg: '#fbc2eb', sun: '#FFCA28', ray: '#FFF9C4' }
        ];
        this.currentTheme = 0;
        
        // Инициализация лучей солнца
        this.initSunRays();
    }

    initSunRays() {
        this.sunRays = [];
        const rayCount = 12;
        for (let i = 0; i < rayCount; i++) {
            this.sunRays.push({
                angle: (i * Math.PI * 2) / rayCount,
                length: 50 + Math.random() * 20,
                pulse: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 0.3
            });
        }
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');

        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.startGame();
            });

            startBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.startGame();
            }, { passive: false });
        }

        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartGame());
        }

        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareScore());
        }

        this.setupCanvasControls();

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.jump();
            }
        });

        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
        }

        console.log('✅ All event listeners setup complete');
    }

    setupCanvasControls() {
        const handleJump = (e) => {
            if (e.type === 'touchstart') {
                e.preventDefault();
            }

            if (this.gameState === 'playing') {
                this.jump();

                if (this.isMobile) {
                    this.createTapEffect(e);
                }
            }

            if (this.gameState === 'menu') {
                this.startGame();
            }
        };

        this.canvas.addEventListener('click', handleJump);
        this.canvas.addEventListener('touchstart', handleJump, { passive: false });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                handleJump(e);
            }
        });
    }

    createTapEffect(e) {
        let x, y;
        if (e.touches && e.touches[0]) {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        } else {
            x = e.clientX;
            y = e.clientY;
        }

        const effect = document.createElement('div');
        effect.style.position = 'fixed';
        effect.style.left = (x - 25) + 'px';
        effect.style.top = (y - 25) + 'px';
        effect.style.width = '50px';
        effect.style.height = '50px';
        effect.style.borderRadius = '50%';
        effect.style.backgroundColor = 'rgba(255, 107, 107, 0.3)';
        effect.style.border = '2px solid rgba(255, 107, 107, 0.5)';
        effect.style.zIndex = '9998';
        effect.style.pointerEvents = 'none';
        effect.style.animation = 'tapEffect 0.5s forwards';

        document.body.appendChild(effect);

        setTimeout(() => {
            document.body.removeChild(effect);
        }, 500);
    }

    startGame() {
        console.log('🎮 START GAME');

        this.gameState = 'playing';

        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const menu = document.getElementById('menu');
        const gameContainer = document.getElementById('gameContainer');

        if (startScreen) startScreen.classList.add('hidden');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');
        if (menu) menu.classList.add('hidden');

        if (gameContainer) {
            gameContainer.classList.add('playing');
        }

        // Сделать персонажа счастливым при старте
        this.player.happy = 1;
        setTimeout(() => {
            this.player.happy = 0;
        }, 1000);

        this.createParticleEffect(this.player.x, this.player.y, 20, this.player.color);
        this.playSound('powerup');
        this.gameLoop();
    }

    createParticleEffect(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 8,
                speedY: (Math.random() - 0.5) * 8,
                color: color,
                life: 1,
                decay: Math.random() * 0.02 + 0.01
            });
        }
    }

    createTextEffect(text, x, y, color) {
        this.effects.push({
            text: text,
            x: x,
            y: y,
            color: color,
            life: 1
        });
    }

    update() {
        if (this.gameState !== 'playing') return;

        this.player.velocityY += this.gravity;
        this.player.y += this.player.velocityY;

        this.player.rotation += this.player.velocityY * 0.5;
        this.player.rotation = Math.max(-25, Math.min(25, this.player.rotation));

        // Анимация глаз (блеск)
        this.player.eyeSparkle += 0.05;
        if (this.player.eyeSparkle > Math.PI * 2) {
            this.player.eyeSparkle = 0;
        }

        // Анимация рта
        this.player.mouthTimer++;
        if (this.player.mouthTimer > 60) {
            this.player.mouthCycle = (this.player.mouthCycle + 1) % 4;
            this.player.mouthTimer = 0;
        }

        // Анимация счастливого состояния
        if (this.player.happy > 0) {
            this.player.happy -= 0.01;
        }

        // Анимация лучей солнца
        this.sunRays.forEach(ray => {
            ray.pulse += ray.speed * 0.05;
            if (ray.pulse > Math.PI * 2) ray.pulse = 0;
        });

        this.player.trail.push({
            x: this.player.x + this.player.width/2,
            y: this.player.y + this.player.height/2,
            life: 1
        });

        if (this.player.trail.length > 5) {
            this.player.trail.shift();
        }

        this.player.trail.forEach(point => point.life -= 0.2);
        this.player.trail = this.player.trail.filter(point => point.life > 0);

        if (this.player.y + this.player.height > this.ground.y) {
            this.player.y = this.ground.y - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
            this.player.rotation = 0;
        }

        this.obstacleTimer++;
        if (this.obstacleTimer > this.obstacleInterval) {
            this.createObstacle();
            this.obstacleTimer = 0;
            this.obstacleInterval = Math.max(40, this.obstacleInterval - 0.2);
        }

        if (Math.random() < 0.02) {
            this.createCollectible();
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.gameSpeed;

            if (this.checkCollision(this.player, obstacle)) {
                this.player.mouthOpen = true;
                this.player.happy = -1; // Грустный персонаж
                setTimeout(() => {
                    this.gameOver();
                }, 300);
                return;
            }

            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
                this.score += 10 * this.multiplier;
                this.combo++;

                if (this.combo % 5 === 0) {
                    this.multiplier++;
                    this.createTextEffect('COMBO x' + this.multiplier, obstacle.x, obstacle.y, '#FFD700');
                    this.playSound('powerup');
                    this.player.happy = 0.5; // Счастливый при комбо
                }

                this.updateScore();
                this.createParticleEffect(obstacle.x, obstacle.y, 5, obstacle.color);
            }
        }

        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            collectible.x -= this.gameSpeed;
            collectible.rotation += 0.1;

            if (this.checkCollision(this.player, collectible)) {
                this.collectibles.splice(i, 1);
                this.score += 50;
                this.player.mouthOpen = true;
                this.player.happy = 0.8; // Очень счастливый при сборе монеты
                setTimeout(() => {
                    this.player.mouthOpen = false;
                }, 150);
                this.createTextEffect('+50', collectible.x, collectible.y, '#00FF00');
                this.createParticleEffect(collectible.x, collectible.y, 15, '#FFFF00');
                this.playSound('score');
                this.updateScore();
            } else if (collectible.x + collectible.width < 0) {
                this.collectibles.splice(i, 1);
            }
        }

        this.gameSpeed += 0.001;

        this.updateParticles();
        this.updateEffects();

        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.1) this.screenShake = 0;
        }
    }

    createCollectible() {
        this.collectibles.push({
            x: this.canvas.width,
            y: this.ground.y - 80,
            width: 20,
            height: 20,
            color: '#FFFF00',
            rotation: 0,
            type: 'coin'
        });
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.life -= p.decay;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateEffects() {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.life -= 0.02;
            effect.y -= 2;

            if (effect.life <= 0) {
                this.effects.splice(i, 1);
            }
        }
    }

    createObstacle() {
        const types = [
            { width: 35, height: 60, type: 'spike' },
            { width: 35, height: 90, type: 'spike' },
            { width: 80, height: 40, type: 'platform' }
        ];

        const type = types[Math.floor(Math.random() * types.length)];
        const theme = this.colorThemes[this.currentTheme];

        this.obstacles.push({
            x: this.canvas.width,
            y: type.type === 'platform' ? this.ground.y - type.height : this.ground.y - type.height,
            width: type.width,
            height: type.height,
            color: theme.secondary,
            type: type.type
        });
    }

    checkCollision(player, object) {
        return player.x < object.x + object.width &&
               player.x + player.width > object.x &&
               player.y < object.y + object.height &&
               player.y + player.height > object.y;
    }

    drawSun() {
        const sunX = this.canvas.width - 80;
        const sunY = 80;
        const sunRadius = 40;
        const theme = this.colorThemes[this.currentTheme];

        // Градиент для солнца
        const sunGradient = this.ctx.createRadialGradient(
            sunX, sunY, 0,
            sunX, sunY, sunRadius
        );
        sunGradient.addColorStop(0, '#FFFFFF');
        sunGradient.addColorStop(0.3, theme.sun);
        sunGradient.addColorStop(1, this.darkenColor(theme.sun, 20));

        // Лучи солнца
        this.sunRays.forEach(ray => {
            const pulseFactor = Math.sin(ray.pulse) * 0.3 + 0.7;
            const currentLength = ray.length * pulseFactor;
            
            this.ctx.save();
            this.ctx.translate(sunX, sunY);
            this.ctx.rotate(ray.angle);
            
            const rayGradient = this.ctx.createLinearGradient(0, 0, currentLength, 0);
            rayGradient.addColorStop(0, theme.ray);
            rayGradient.addColorStop(1, 'rgba(255, 245, 157, 0)');
            
            this.ctx.fillStyle = rayGradient;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(currentLength, -3);
            this.ctx.lineTo(currentLength, 3);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.restore();
        });

        // Основной диск солнца
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = sunGradient;
        this.ctx.fill();

        // Свечение вокруг солнца
        const glowGradient = this.ctx.createRadialGradient(
            sunX, sunY, sunRadius,
            sunX, sunY, sunRadius + 20
        );
        glowGradient.addColorStop(0, 'rgba(255, 235, 59, 0.3)');
        glowGradient.addColorStop(1, 'rgba(255, 235, 59, 0)');
        
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, sunRadius + 20, 0, Math.PI * 2);
        this.ctx.fillStyle = glowGradient;
        this.ctx.fill();

        // Детали на солнце (пятна)
        this.ctx.fillStyle = this.darkenColor(theme.sun, 15);
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5;
            const spotRadius = sunRadius * 0.15;
            const spotX = sunX + Math.cos(angle) * sunRadius * 0.6;
            const spotY = sunY + Math.sin(angle) * sunRadius * 0.6;
            
            this.ctx.beginPath();
            this.ctx.arc(spotX, spotY, spotRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawPlayer() {
        const theme = this.colorThemes[this.currentTheme];
        const happyOffset = this.player.happy * 5; // Смещение при счастье
        const eyeSparkleFactor = Math.sin(this.player.eyeSparkle) * 0.5 + 0.5;

        this.ctx.save();
        this.ctx.translate(
            this.player.x + this.player.width/2,
            this.player.y + this.player.height/2
        );
        this.ctx.rotate(this.player.rotation * Math.PI / 180);
        this.ctx.scale(this.player.scale, this.player.scale);

        // Тело персонажа с градиентом
        const bodyGradient = this.ctx.createLinearGradient(
            -this.player.width/2, -this.player.height/2,
            this.player.width/2, this.player.height/2
        );
        bodyGradient.addColorStop(0, theme.primary);
        bodyGradient.addColorStop(0.5, this.lightenColor(theme.primary, 20));
        bodyGradient.addColorStop(1, this.darkenColor(theme.primary, 20));

        // Скругленный прямоугольник для тела
        const cornerRadius = 8;
        this.ctx.fillStyle = bodyGradient;
        this.ctx.beginPath();
        this.ctx.roundRect(-this.player.width/2, -this.player.height/2, 
                          this.player.width, this.player.height, cornerRadius);
        this.ctx.fill();

        // Обводка тела
        this.ctx.strokeStyle = this.darkenColor(theme.primary, 30);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Тень под персонажем
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, this.player.height/2 + 3, 
                         this.player.width/2 * 0.8, this.player.height/4, 
                         0, 0, Math.PI * 2);
        this.ctx.fill();

        // Глаза
        const eyeY = -this.player.height/4 + happyOffset;
        
        // Левый глаз
        this.ctx.save();
        this.ctx.translate(-this.player.width/4, eyeY);
        
        // Белок глаза
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Радужка
        this.ctx.fillStyle = '#2196F3';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Зрачок
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Блеск в глазах
        if (eyeSparkleFactor > 0.8) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(-1, -1, 0.8, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();

        // Правый глаз
        this.ctx.save();
        this.ctx.translate(this.player.width/4 - 2, eyeY);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#2196F3';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        if (eyeSparkleFactor > 0.8) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(-1, -1, 0.8, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();

        // Брови (анимируются при эмоциях)
        const browY = eyeY - 6 + (this.player.happy > 0 ? -2 : this.player.happy < 0 ? 2 : 0);
        this.ctx.strokeStyle = this.darkenColor(theme.primary, 40);
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        
        // Левая бровь
        this.ctx.beginPath();
        this.ctx.moveTo(-this.player.width/4 - 3, browY);
        this.ctx.lineTo(-this.player.width/4 + 3, browY - (this.player.happy < 0 ? 2 : 0));
        this.ctx.stroke();
        
        // Правая бровь
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.width/4 - 5, browY - (this.player.happy < 0 ? 2 : 0));
        this.ctx.lineTo(this.player.width/4 + 1, browY);
        this.ctx.stroke();

        // Рот
        const mouthY = this.player.height/6 + happyOffset;
        this.ctx.fillStyle = '#000000';
        
        if (this.player.mouthOpen) {
            // Открытый рот (округлый)
            this.ctx.beginPath();
            this.ctx.arc(0, mouthY + 2, this.player.width/6, 0, Math.PI);
            this.ctx.fill();
        } else {
            // Анимированный рот в зависимости от эмоций
            let mouthHeight = 2;
            let mouthCurve = 0;
            
            if (this.player.happy > 0) {
                // Улыбка при счастье
                this.ctx.beginPath();
                this.ctx.arc(0, mouthY + 3, this.player.width/5, 0, Math.PI, true);
                this.ctx.fill();
            } else if (this.player.happy < 0) {
                // Грустный рот
                this.ctx.beginPath();
                this.ctx.arc(0, mouthY - 2, this.player.width/5, Math.PI, 0, true);
                this.ctx.fill();
            } else {
                // Нормальный рот (анимация по циклу)
                switch(this.player.mouthCycle) {
                    case 0:
                        this.ctx.fillRect(-this.player.width/8, mouthY, 
                                        this.player.width/4, 2);
                        break;
                    case 1:
                        this.ctx.beginPath();
                        this.ctx.arc(0, mouthY + 1, this.player.width/8, 
                                    0, Math.PI, false);
                        this.ctx.fill();
                        break;
                    case 2:
                        this.ctx.fillRect(-this.player.width/6, mouthY, 
                                        this.player.width/3, 1.5);
                        break;
                    case 3:
                        this.ctx.beginPath();
                        this.ctx.arc(0, mouthY, this.player.width/8, 
                                    Math.PI, 0, false);
                        this.ctx.fill();
                        break;
                }
            }
        }

        // Щеки (появляются при счастье)
        if (this.player.happy > 0.3) {
            this.ctx.fillStyle = 'rgba(255, 107, 107, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(-this.player.width/3, this.player.height/6, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(this.player.width/3, this.player.height/6, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    draw() {
        const shakeX = this.screenShake * (Math.random() - 0.5) * 10;
        const shakeY = this.screenShake * (Math.random() - 0.5) * 10;

        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);

        const theme = this.colorThemes[this.currentTheme];

        // ФОН С ГРАДИЕНТОМ
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, this.lightenColor(theme.bg, 20));
        gradient.addColorStop(0.5, theme.bg);
        gradient.addColorStop(1, this.darkenColor(theme.bg, 20));
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // ОБЛАКА
        this.drawClouds();

        // СОЛНЦЕ
        this.drawSun();

        // ЗЕМЛЯ С ТЕКСТУРОЙ
        this.ctx.fillStyle = '#81C784';
        this.ctx.fillRect(0, this.ground.y, this.canvas.width, this.ground.height);

        // ТРАВА С ДЕТАЛЯМИ
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(0, this.ground.y - 10, this.canvas.width, 10);
        
        // Детали травы
        this.ctx.strokeStyle = '#2E7D32';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.width; i += 15) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, this.ground.y - 10);
            this.ctx.lineTo(i + 7, this.ground.y - 15 - Math.sin(i * 0.1) * 3);
            this.ctx.stroke();
        }

        // ЦВЕТЫ НА ТРАВЕ
        for (let i = 0; i < 5; i++) {
            const flowerX = (this.canvas.width * 0.2 * i + Date.now() * 0.01) % this.canvas.width;
            const flowerY = this.ground.y - 12;
            
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.beginPath();
            this.ctx.arc(flowerX, flowerY, 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#FFD166';
            this.ctx.beginPath();
            this.ctx.arc(flowerX, flowerY, 1, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.collectibles.forEach(collectible => {
            this.ctx.save();
            this.ctx.translate(collectible.x + collectible.width/2, collectible.y + collectible.height/2);
            this.ctx.rotate(collectible.rotation);

            // Монета с градиентом
            const coinGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, collectible.width/2);
            coinGradient.addColorStop(0, '#FFFF00');
            coinGradient.addColorStop(0.7, '#FFD700');
            coinGradient.addColorStop(1, '#FFA000');
            
            this.ctx.fillStyle = coinGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, collectible.width/2, 0, Math.PI * 2);
            this.ctx.fill();

            // Блеск монеты
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(-collectible.width/4, -collectible.height/4, 3, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = '#FFA000';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();

            this.ctx.restore();
        });

        // ПРЕПЯТСТВИЯ С ТЕНЯМИ
        this.obstacles.forEach(obstacle => {
            // Тень
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            if (obstacle.type === 'spike') {
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x + 3, obstacle.y + obstacle.height + 3);
                this.ctx.lineTo(obstacle.x + obstacle.width / 2 + 3, obstacle.y + 3);
                this.ctx.lineTo(obstacle.x + obstacle.width + 3, obstacle.y + obstacle.height + 3);
                this.ctx.closePath();
                this.ctx.fill();
            } else {
                this.ctx.fillRect(obstacle.x + 3, obstacle.y + 3, obstacle.width, obstacle.height);
            }

            // Основное препятствие
            this.ctx.fillStyle = obstacle.color;
            
            if (obstacle.type === 'spike') {
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
                this.ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
                this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Детали на шипах
                this.ctx.strokeStyle = this.darkenColor(obstacle.color, 30);
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x + obstacle.width/4, obstacle.y + obstacle.height/2);
                this.ctx.lineTo(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/4);
                this.ctx.stroke();
            } else {
                // Платформа с градиентом
                const platformGradient = this.ctx.createLinearGradient(
                    obstacle.x, obstacle.y,
                    obstacle.x, obstacle.y + obstacle.height
                );
                platformGradient.addColorStop(0, this.lightenColor(obstacle.color, 20));
                platformGradient.addColorStop(1, this.darkenColor(obstacle.color, 20));
                
                this.ctx.fillStyle = platformGradient;
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // Текстура платформы
                this.ctx.strokeStyle = this.darkenColor(obstacle.color, 30);
                this.ctx.lineWidth = 1;
                for (let i = 0; i < obstacle.width; i += 10) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(obstacle.x + i, obstacle.y);
                    this.ctx.lineTo(obstacle.x + i, obstacle.y + obstacle.height);
                    this.ctx.stroke();
                }
            }
        });

        // СЛЕД ИГРОКА С ГРАДИЕНТОМ
        if (this.player.trail.length > 1) {
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            this.player.trail.forEach((point, index) => {
                if (index < this.player.trail.length - 1) {
                    const nextPoint = this.player.trail[index + 1];
                    const gradient = this.ctx.createLinearGradient(
                        point.x, point.y,
                        nextPoint.x, nextPoint.y
                    );
                    gradient.addColorStop(0, `rgba(255, 107, 107, ${point.life * 0.6})`);
                    gradient.addColorStop(1, `rgba(255, 107, 107, ${nextPoint.life * 0.6})`);
                    
                    this.ctx.strokeStyle = gradient;
                    this.ctx.beginPath();
                    this.ctx.moveTo(point.x, point.y);
                    this.ctx.lineTo(nextPoint.x, nextPoint.y);
                    this.ctx.stroke();
                }
            });
        }

        // ИГРОК
        this.drawPlayer();

        // ЧАСТИЦЫ
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;

        // ТЕКСТОВЫЕ ЭФФЕКТЫ С ТЕНЬЮ
        this.effects.forEach(effect => {
            // Тень текста
            this.ctx.globalAlpha = effect.life * 0.5;
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(effect.text, effect.x + 1, effect.y + 1);
            
            // Основной текст
            this.ctx.globalAlpha = effect.life;
            this.ctx.fillStyle = effect.color;
            this.ctx.fillText(effect.text, effect.x, effect.y);
        });
        this.ctx.globalAlpha = 1;

        this.ctx.restore();
    }

    drawClouds() {
        const theme = this.colorThemes[this.currentTheme];
        const cloudPositions = [
            { x: this.canvas.width * 0.2, y: 100, size: 1.2, speed: 0.3 },
            { x: this.canvas.width * 0.6, y: 150, size: 0.8, speed: 0.5 },
            { x: this.canvas.width * 0.8, y: 80, size: 1.0, speed: 0.4 },
            { x: this.canvas.width * 0.4, y: 180, size: 1.5, speed: 0.2 }
        ];

        const cloudTime = Date.now() * 0.001;

        cloudPositions.forEach((cloud, index) => {
            const cloudX = (cloud.x + cloudTime * 20 * cloud.speed) % (this.canvas.width + 200) - 100;
            
            this.ctx.save();
            this.ctx.translate(cloudX, cloud.y);
            this.ctx.scale(cloud.size, cloud.size);
            
            // Мягкие облака
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(cloudTime + index) * 0.1})`;
            
            // Основная часть облака
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 30, 0, Math.PI * 2);
            this.ctx.arc(25, -10, 25, 0, Math.PI * 2);
            this.ctx.arc(-25, -5, 20, 0, Math.PI * 2);
            this.ctx.arc(15, 15, 20, 0, Math.PI * 2);
            this.ctx.arc(-20, 20, 15, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }

    gameOver() {
        console.log('💀 GAME OVER');
        this.gameState = 'gameOver';
        this.screenShake = 10;

        // Сохраняем рекорд
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('geometryDashHighScore', this.highScore);
            this.highScoreElement.textContent = `🏆 Рекорд: ${this.highScore}`;
        }

        // Показываем экран Game Over
        const gameOverScreen = document.getElementById('gameOverScreen');
        const finalScore = document.getElementById('finalScore');
        const menu = document.getElementById('menu');
        const gameContainer = document.getElementById('gameContainer');

        if (finalScore) {
            finalScore.textContent = `Очки: ${this.score}`;
        }

        if (gameOverScreen) gameOverScreen.classList.remove('hidden');
        if (menu) menu.classList.remove('hidden');

        if (gameContainer) {
            gameContainer.classList.remove('playing');
        }

        this.playSound('gameover');
    }

    restartGame() {
        console.log('🔄 RESTART GAME');
        this.initGame();
        this.startGame();
    }

    updateScore() {
        if (this.scoreElement) {
            this.scoreElement.textContent = `Очки: ${this.score}`;
        }
    }

    setupMobile() {
        if ('orientation' in screen) {
            screen.orientation.lock('landscape').catch(() => {});
        }
    }

    setupAudio() {
        this.sounds = {
            jump: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-jump-arcade-game-166.mp3'),
            score: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'),
            powerup: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-power-up-optimistic-2037.mp3'),
            gameover: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-losing-drums-2023.mp3')
        };
        
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.3;
            sound.preload = 'auto';
        });
    }

    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(e => console.log('Audio error:', e));
        }
    }

    shareScore() {
        const shareText = `Я набрал ${this.score} очков в Geometry Dash! 🎮`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Geometry Dash - Техникум Edition',
                text: shareText,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Результат скопирован в буфер обмена!');
            });
        }
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        
        return '#' + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        
        return '#' + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }

    gameLoop() {
        if (this.gameState === 'playing') {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Добавляем поддержку roundRect для старых браузеров
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
        return this;
    }
}

// Инициализация
function initializeGame() {
    console.log('🚀 INITIALIZING GAME...');

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.game = new GeometryDash();
        });
    } else {
        window.game = new GeometryDash();
    }
}

// Запуск
console.log('🎮 Geometry Dash Mobile Ultimate - Loading...');
initializeGame();