import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// --- НАСТРОЙКА СЦЕНЫ И РЕНДЕРЕРА ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(10, 20, 10);
scene.add(sunLight);

// Звук
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playShootSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

// --- КОЛЛИЗИИ (Хитбоксы) ---
const solidBoxes = [];
const solidMeshes = [];

const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x4caf50 }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const path = new THREE.Mesh(new THREE.PlaneGeometry(4, 100), new THREE.MeshStandardMaterial({ color: 0x8b7355 }));
path.rotation.x = -Math.PI / 2; path.position.y = 0.01;
scene.add(path);

function createHouse(x, z) {
    const houseGroup = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const parts = [
        new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 5), wallMat), 
        new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 5), wallMat), 
        new THREE.Mesh(new THREE.BoxGeometry(5, 3, 0.5), wallMat), 
        new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 0.5), wallMat), 
        new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 0.5), wallMat), 
        new THREE.Mesh(new THREE.ConeGeometry(4, 2, 4), new THREE.MeshStandardMaterial({ color: 0xa52a2a }))
    ];
    
    parts[0].position.set(-2.25, 1.5, 0); parts[1].position.set(2.25, 1.5, 0); parts[2].position.set(0, 1.5, -2.25);
    parts[3].position.set(-1.75, 1.5, 2.25); parts[4].position.set(1.75, 1.5, 2.25);
    parts[5].position.set(0, 4, 0); parts[5].rotation.y = Math.PI / 4;

    parts.forEach(p => { houseGroup.add(p); solidMeshes.push(p); });
    houseGroup.position.set(x, 0, z); scene.add(houseGroup);

    houseGroup.updateMatrixWorld();
    solidBoxes.push(new THREE.Box3().setFromObject(houseGroup));
}

function createWell(x, z) {
    const wellGroup = new THREE.Group();
    const parts = [
        new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1, 16), new THREE.MeshStandardMaterial({ color: 0x666666 })),
        new THREE.Mesh(new THREE.ConeGeometry(2, 1, 4), new THREE.MeshStandardMaterial({ color: 0xa52a2a }))
    ];
    parts[0].position.y = 0.5;
    parts[1].position.set(0, 3.5, 0); parts[1].rotation.y = Math.PI / 4;
    
    parts.forEach(p => { wellGroup.add(p); solidMeshes.push(p); });
    wellGroup.position.set(x, 0, z); scene.add(wellGroup);

    wellGroup.updateMatrixWorld();
    solidBoxes.push(new THREE.Box3().setFromObject(wellGroup));
}

createHouse(10, -10);
createHouse(-15, 5);
createWell(6, 0);

// --- ПЕРСОНАЖ ---
const playerGroup = new THREE.Group();
const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
const pinkMat = new THREE.MeshStandardMaterial({ color: 0xff66aa }); 

const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), skinMat); head.position.y = 1.6;
const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), skinMat); body.position.y = 1.05;
const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6), skinMat); armL.position.set(-0.35, 1.1, 0);
const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6), skinMat); armR.position.set(0.35, 1.1, 0);
const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7), skinMat); legL.position.set(-0.15, 0.35, 0);
const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7), skinMat); legR.position.set(0.15, 0.35, 0);

const dickGroup = new THREE.Group();
dickGroup.position.set(0, 0.65, 0.15); 
const leftBall = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), skinMat); leftBall.position.set(-0.12, 0, 0);
const rightBall = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), skinMat); rightBall.position.set(0.12, 0, 0);
const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 16), skinMat); shaft.rotation.x = Math.PI / 2; shaft.position.set(0, 0, 0.25);
const glans = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), pinkMat); glans.position.set(0, 0, 0.5);
dickGroup.add(leftBall, rightBall, shaft, glans);

playerGroup.add(head, body, armL, armR, legL, legR, dickGroup);

const nicknameDiv = document.createElement('div');
nicknameDiv.className = 'player-name-label';
const nicknameLabel = new CSS2DObject(nicknameDiv);
nicknameLabel.position.set(0, 2.2, 0);
playerGroup.add(nicknameLabel);
scene.add(playerGroup);

// --- СНАРЯДЫ ---
const projectiles = [];
let canShoot = true;
const SHOOT_COOLDOWN = 150;
const bulletRaycaster = new THREE.Raycaster();

function shoot() {
    if (!canShoot || gameState !== 'play') return;
    canShoot = false;
    setTimeout(() => { canShoot = true; }, SHOOT_COOLDOWN);
    playShootSound();

    const proj = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const spawnPos = new THREE.Vector3(0, 0.65, 0.7); 
    spawnPos.applyMatrix4(playerGroup.matrixWorld);
    proj.position.copy(spawnPos);

    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(playerGroup.quaternion);

    scene.add(proj);
    projectiles.push({ mesh: proj, dir: direction, life: 150 });
}

const shootBtn = document.getElementById('shoot-btn');
shootBtn.addEventListener('touchstart', (e) => { e.preventDefault(); shoot(); });
document.addEventListener('mousedown', () => {
    if (gameState === 'play' && currentControlMode === 'pc' && document.pointerLockElement === document.body) shoot();
});

// --- СИСТЕМА АНИМАЦИЙ ---
let currentAnim = 'idle';
document.getElementById('anim-btn').addEventListener('click', () => {
    const menu = document.getElementById('anim-menu');
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
});
document.querySelectorAll('.anim-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentAnim = e.target.getAttribute('data-anim');
        document.getElementById('anim-menu').style.display = 'none';
    });
});


// --- УПРАВЛЕНИЕ ---
let gameState = 'menu';
let currentControlMode = 'mobile';
const speed = 0.15;

let moveX = 0; let moveY = 0;
const keys = { w: false, a: false, s: false, d: false };
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

document.getElementById('play-btn').addEventListener('click', () => {
    nicknameDiv.textContent = document.getElementById('nickname-input').value || "Игрок";
    document.getElementsByName('controls').forEach(r => { if(r.checked) currentControlMode = r.value; });

    gameState = 'play';
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('crosshair').style.display = 'block';
    playerGroup.rotation.y = 0;
    
    if (currentControlMode === 'mobile') document.getElementById('game-ui').style.display = 'block';
    else document.body.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement !== document.body && gameState === 'play' && currentControlMode === 'pc') {
        gameState = 'menu';
        document.getElementById('main-menu').style.display = 'flex';
        document.getElementById('crosshair').style.display = 'none';
    }
});

document.addEventListener('mousemove', (e) => {
    if (gameState === 'play' && currentControlMode === 'pc' && document.pointerLockElement === document.body) {
        playerGroup.rotation.y -= e.movementX * 0.003;
    }
});

const joystick = nipplejs.create({
    zone: document.getElementById('joystick-zone'),
    mode: 'dynamic',
    color: 'white'
});

joystick.on('move', (evt, data) => {
    if (data.angle) {
        moveX = Math.cos(data.angle.radian);
        moveY = Math.sin(data.angle.radian);
    }
});
joystick.on('end', () => { moveX = 0; moveY = 0; });

const cameraZone = document.getElementById('camera-zone');
let lastTouchX = 0;
cameraZone.addEventListener('touchstart', (e) => { lastTouchX = e.touches[0].clientX; });
cameraZone.addEventListener('touchmove', (e) => {
    if (currentControlMode !== 'mobile') return;
    playerGroup.rotation.y -= (e.touches[0].clientX - lastTouchX) * 0.005; 
    lastTouchX = e.touches[0].clientX;
});

// --- ЦИКЛ ИГРЫ И АНИМАЦИИ ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    if (gameState === 'menu') {
        playerGroup.rotation.y += 0.01;
        camera.position.set(2, 2, -4);
        camera.lookAt(playerGroup.position.x, 1, playerGroup.position.z);
    } 
    else if (gameState === 'play') {
        
        // ОБРАБОТКА АНИМАЦИЙ
        if (currentAnim === 'wank') {
            // Рука тянется к органу и двигается вверх-вниз по синусоиде
            armR.position.set(0.08, 0.75, 0.3);
            armR.rotation.z = Math.PI / 4; // Наклон к центру
            armR.rotation.x = -Math.PI / 3 + Math.sin(time * 20) * 0.2; 
            
            // Орган слегка пульсирует в такт движениям
            dickGroup.scale.set(1.2, 1.2, 1.2 + Math.sin(time * 20) * 0.1); 
        } else {
            // Возврат к стандартной позе (idle)
            armR.position.set(0.35, 1.1, 0);
            armR.rotation.set(0, 0, 0);
            dickGroup.scale.set(1, 1, 1);
        }

        const oldPos = playerGroup.position.clone();

        // ИСПРАВЛЕННАЯ ЛОГИКА ДВИЖЕНИЯ
        if (currentControlMode === 'mobile') {
            if (moveX !== 0 || moveY !== 0) {
                // Изменены знаки! Теперь направления идеально совпадают со стиком
                playerGroup.translateX(-moveX * speed);
                playerGroup.translateZ(moveY * speed);
            }
        } else {
            if (keys.w) playerGroup.translateZ(-speed);
            if (keys.s) playerGroup.translateZ(speed);
            if (keys.a) playerGroup.translateX(-speed);
            if (keys.d) playerGroup.translateX(speed);
        }

        const playerHitbox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(playerGroup.position.x, playerGroup.position.y + 1, playerGroup.position.z),
            new THREE.Vector3(1, 2, 1)
        );

        let collision = false;
        for (let box of solidBoxes) {
            if (playerHitbox.intersectsBox(box)) {
                collision = true;
                break;
            }
        }
        
        if (collision) playerGroup.position.copy(oldPos);

        const cameraOffset = new THREE.Vector3(0, 2.5, -4);
        cameraOffset.applyQuaternion(playerGroup.quaternion);
        camera.position.copy(playerGroup.position).add(cameraOffset);
        camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1, playerGroup.position.z);

        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            
            bulletRaycaster.set(p.mesh.position, p.dir);
            const hits = bulletRaycaster.intersectObjects(solidMeshes, false);
            
            if (hits.length > 0 && hits[0].distance < 0.6) {
                scene.remove(p.mesh);
                projectiles.splice(i, 1);
                continue;
            }

            p.mesh.position.addScaledVector(p.dir, 0.5); 
            p.life -= 1;
            
            if (p.life <= 0) {
                scene.remove(p.mesh);
                projectiles.splice(i, 1);
            }
        }
    }

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});
// В САМОЕ НАЧАЛО файла game.js добавь подключение к серверу
const socket = io(); 
const otherPlayers = {}; // Хранилище моделей других игроков

// --- ФУНКЦИЯ СОЗДАНИЯ МОДЕЛИ ИГРОКА ---
// Мы упаковываем генерацию человечка в функцию, чтобы создавать копии для мультиплеера
function createPlayerModel(nicknameStr) {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
    const pinkMat = new THREE.MeshStandardMaterial({ color: 0xff66aa }); 

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), skinMat); head.position.y = 1.6;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), skinMat); body.position.y = 1.05;
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6), skinMat); armL.position.set(-0.35, 1.1, 0);
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6), skinMat); armR.position.set(0.35, 1.1, 0);
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7), skinMat); legL.position.set(-0.15, 0.35, 0);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7), skinMat); legR.position.set(0.15, 0.35, 0);

    const dickGroup = new THREE.Group();
    dickGroup.position.set(0, 0.65, 0.15); 
    const leftBall = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), skinMat); leftBall.position.set(-0.12, 0, 0);
    const rightBall = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), skinMat); rightBall.position.set(0.12, 0, 0);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 16), skinMat); shaft.rotation.x = Math.PI / 2; shaft.position.set(0, 0, 0.25);
    const glans = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), pinkMat); glans.position.set(0, 0, 0.5);
    dickGroup.add(leftBall, rightBall, shaft, glans);

    group.add(head, body, armL, armR, legL, legR, dickGroup);

    const nickDiv = document.createElement('div');
    nickDiv.className = 'player-name-label';
    nickDiv.textContent = nicknameStr;
    const nickLabel = new CSS2DObject(nickDiv);
    nickLabel.position.set(0, 2.2, 0);
    group.add(nickLabel);

    // Сохраняем ссылки на части тела, чтобы анимировать их потом
    group.userData = { armR: armR, dickGroup: dickGroup, anim: 'idle' };

    scene.add(group);
    return group;
}

// Заменяем старое создание playerGroup на вызов функции:
const playerGroup = createPlayerModel("Игрок");

// --- СЕТЕВАЯ ЛОГИКА ---
// Загрузка уже играющих
socket.on('currentPlayers', (players) => {
    Object.keys(players).forEach((id) => {
        if (id === socket.id) return;
        otherPlayers[id] = createPlayerModel(players[id].nickname);
        otherPlayers[id].position.set(players[id].x, 0, players[id].z);
        otherPlayers[id].rotation.y = players[id].rotation;
    });
});

// Кто-то подключился
socket.on('newPlayer', (playerInfo) => {
    otherPlayers[playerInfo.id] = createPlayerModel(playerInfo.nickname);
});

// Кто-то отключился
socket.on('playerDisconnected', (id) => {
    if (otherPlayers[id]) {
        scene.remove(otherPlayers[id]);
        delete otherPlayers[id];
    }
});

// Движение других игроков
socket.on('playerMoved', (playerInfo) => {
    if (otherPlayers[playerInfo.id]) {
        otherPlayers[playerInfo.id].position.set(playerInfo.x, 0, playerInfo.z);
        otherPlayers[playerInfo.id].rotation.y = playerInfo.rotation;
    }
});

// Анимация других игроков
socket.on('playerAnimChanged', (data) => {
    if (otherPlayers[data.id]) {
        otherPlayers[data.id].userData.anim = data.anim;
    }
});

// Чужая стрельба
socket.on('otherPlayerShoot', (data) => {
    playShootSound();
    const proj = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    proj.position.copy(data.pos);
    const direction = new THREE.Vector3(data.dir.x, data.dir.y, data.dir.z);
    scene.add(proj);
    projectiles.push({ mesh: proj, dir: direction, life: 150 });
});

// --- В КНОПКУ ИГРАТЬ (ОТПРАВКА НИКА) ---
document.getElementById('play-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('nickname-input').value || "Игрок";
    playerGroup.children.forEach(child => { if(child.isCSS2DObject) child.element.textContent = nameInput; });
    socket.emit('setNickname', nameInput); // Отправляем на сервер
    // ... остальной код кнопки
});

// --- В ФУНКЦИЮ shoot() ---
// После создания твоего снаряда, добавь отправку на сервер:
socket.emit('shoot', { 
    pos: proj.position, 
    dir: direction 
});

// --- В МЕНЮ АНИМАЦИЙ ---
document.querySelectorAll('.anim-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentAnim = e.target.getAttribute('data-anim');
        document.getElementById('anim-menu').style.display = 'none';
        socket.emit('playerAnim', currentAnim); // Отправляем серверу
    });
});

// --- В ЦИКЛ animate() ---
// После блока с расчетом твоего движения, нужно отправить координаты:
if (moveX !== 0 || moveY !== 0 || isSwiping || keys.w || keys.a || keys.s || keys.d) {
    socket.emit('playerMove', {
        x: playerGroup.position.x,
        z: playerGroup.position.z,
        rotation: playerGroup.rotation.y
    });
}

// Анимация чужих игроков в цикле animate():
Object.values(otherPlayers).forEach(other => {
    if (other.userData.anim === 'wank') {
        other.userData.armR.position.set(0.08, 0.75, 0.3);
        other.userData.armR.rotation.z = Math.PI / 4;
        other.userData.armR.rotation.x = -Math.PI / 3 + Math.sin(time * 20) * 0.2; 
        other.userData.dickGroup.scale.set(1.2, 1.2, 1.2 + Math.sin(time * 20) * 0.1); 
    } else {
        other.userData.armR.position.set(0.35, 1.1, 0);
        other.userData.armR.rotation.set(0, 0, 0);
        other.userData.dickGroup.scale.set(1, 1, 1);
    }
});
