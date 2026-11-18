// 雨夜便利店街角场景
// Three.js 三渲二风格微缩模型

(function() {
    'use strict';

    // 场景配置
    const CONFIG = {
        // 底座大小
        baseSize: 20,
        // 便利店大小
        storeWidth: 8,
        storeDepth: 6,
        storeHeight: 3.5,
        // 颜色方案
        colors: {
            // 夜晚天空
            nightSky: 0x1a1a2e,
            // 地面
            ground: 0x2d2d2d,
            wetGround: 0x1a1a1a,
            // 便利店外墙
            storeWall: 0xf5f5f5,
            storeAccent: 0x3a86ff,
            // 玻璃
            glass: 0x88ccff,
            // 室内灯光
            indoorLight: 0xfff4e6,
            warmLight: 0xffd93d,
            // 霓虹灯
            neonBlue: 0x00d4ff,
            neonRed: 0xff6b6b,
            neonGreen: 0x51cf66,
            // 雨滴
            rain: 0xaaddff,
            // 其他
            concrete: 0x4a4a4a,
            metal: 0x6c757d,
            wood: 0x8b4513
        }
    };

    // 全局变量
    let scene, camera, renderer, controls;
    let rainParticles, clock;
    let animatables = [];

    // 初始化
    function init() {
        // 创建场景
        scene = new THREE.Scene();
        scene.background = new THREE.Color(CONFIG.colors.nightSky);
        scene.fog = new THREE.Fog(0x1a1a2e, 15, 50);

        // 创建相机
        camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        camera.position.set(15, 12, 15);
        camera.lookAt(0, 0, 0);

        // 创建渲染器
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        document.getElementById('container').appendChild(renderer.domElement);

        // 创建控制器
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 8;
        controls.maxDistance = 35;
        controls.maxPolarAngle = Math.PI / 2.1;
        controls.target.set(0, 1, 0);

        // 创建时钟
        clock = new THREE.Clock();

        // 添加灯光
        setupLights();

        // 创建场景内容
        createBase();
        createConvenienceStore();
        createOutdoorElements();
        createRain();
        createReflections();

        // 窗口调整
        window.addEventListener('resize', onWindowResize);

        // 开始动画
        animate();
    }

    // 设置灯光
    function setupLights() {
        // 环境光（冷色调夜光）
        const ambientLight = new THREE.AmbientLight(0x4466aa, 0.3);
        scene.add(ambientLight);

        // 主光源（月光效果）
        const moonLight = new THREE.DirectionalLight(0x8888cc, 0.5);
        moonLight.position.set(10, 20, 5);
        moonLight.castShadow = true;
        moonLight.shadow.mapSize.width = 2048;
        moonLight.shadow.mapSize.height = 2048;
        moonLight.shadow.camera.near = 0.5;
        moonLight.shadow.camera.far = 50;
        moonLight.shadow.camera.left = -15;
        moonLight.shadow.camera.right = 15;
        moonLight.shadow.camera.top = 15;
        moonLight.shadow.camera.bottom = -15;
        scene.add(moonLight);

        // 室内暖光（点光源）
        const indoorLight1 = new THREE.PointLight(CONFIG.colors.warmLight, 1.5, 15);
        indoorLight1.position.set(-2, 2.5, 0);
        scene.add(indoorLight1);

        const indoorLight2 = new THREE.PointLight(CONFIG.colors.indoorLight, 1, 12);
        indoorLight2.position.set(2, 2.5, 0);
        scene.add(indoorLight2);

        // 路灯
        const streetLamp = new THREE.SpotLight(0xffddaa, 2, 15, Math.PI / 6, 0.5, 1);
        streetLamp.position.set(6, 5, 5);
        streetLamp.target.position.set(6, 0, 5);
        streetLamp.castShadow = true;
        scene.add(streetLamp);
        scene.add(streetLamp.target);

        // 霓虹灯效果
        const neonLight1 = new THREE.PointLight(CONFIG.colors.neonBlue, 1, 8);
        neonLight1.position.set(-2, 3, 5.5);
        scene.add(neonLight1);
        animatables.push({
            type: 'flicker',
            object: neonLight1,
            intensity: 1,
            speed: 2
        });

        const neonLight2 = new THREE.PointLight(CONFIG.colors.neonRed, 0.8, 8);
        neonLight2.position.set(2, 3, 5.5);
        scene.add(neonLight2);
        animatables.push({
            type: 'flicker',
            object: neonLight2,
            intensity: 0.8,
            speed: 1.5
        });
    }

    // 创建底座
    function createBase() {
        // 正方形底座
        const baseGeometry = new THREE.BoxGeometry(CONFIG.baseSize, 0.5, CONFIG.baseSize);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.ground,
            roughness: 0.8,
            metalness: 0.1
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.25;
        base.receiveShadow = true;
        scene.add(base);

        // 湿润的街道地面（顶面）
        const groundGeometry = new THREE.PlaneGeometry(CONFIG.baseSize - 0.5, CONFIG.baseSize - 0.5);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.wetGround,
            roughness: 0.3,
            metalness: 0.5,
            envMapIntensity: 1.5
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0.01;
        ground.receiveShadow = true;
        scene.add(ground);

        // 创建斑马线
        createZebraCrossing();

        // 创建排水沟
        createDrainage();
    }

    // 创建斑马线
    function createZebraCrossing() {
        const stripeWidth = 0.4;
        const stripeLength = 3;
        const numStripes = 8;
        const spacing = 0.5;

        for (let i = 0; i < numStripes; i++) {
            const stripeGeometry = new THREE.PlaneGeometry(stripeWidth, stripeLength);
            const stripeMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.4,
                metalness: 0.2,
                emissive: 0x333333,
                emissiveIntensity: 0.3
            });
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(-6.5 + i * (stripeWidth + spacing), 0.02, 2);
            scene.add(stripe);
        }
    }

    // 创建排水沟
    function createDrainage() {
        const drainGeometry = new THREE.BoxGeometry(CONFIG.baseSize, 0.15, 0.3);
        const drainMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.9,
            metalness: 0.3
        });

        // 街道边缘的排水沟
        const drain1 = new THREE.Mesh(drainGeometry, drainMaterial);
        drain1.position.set(0, 0.075, -CONFIG.baseSize/2 + 0.15);
        scene.add(drain1);

        const drain2 = new THREE.Mesh(drainGeometry, drainMaterial);
        drain2.rotation.y = Math.PI / 2;
        drain2.position.set(CONFIG.baseSize/2 - 0.15, 0.075, 0);
        scene.add(drain2);
    }

    // 创建便利店
    function createConvenienceStore() {
        const store = new THREE.Group();

        // 便利店主体（外墙）
        createStoreWalls(store);

        // 玻璃橱窗
        createGlassWindows(store);

        // 屋顶和雨棚
        createRoof(store);

        // 室内陈设
        createInterior(store);

        // 招牌
        createSignage(store);

        scene.add(store);
    }

    // 创建便利店外墙
    function createStoreWalls(store) {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.storeWall,
            roughness: 0.6,
            metalness: 0.1
        });

        const accentMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.storeAccent,
            roughness: 0.5,
            metalness: 0.2
        });

        // 左侧墙
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, CONFIG.storeHeight, CONFIG.storeDepth),
            wallMaterial
        );
        leftWall.position.set(-CONFIG.storeWidth/2, CONFIG.storeHeight/2, 0);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        store.add(leftWall);

        // 右侧墙
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, CONFIG.storeHeight, CONFIG.storeDepth),
            wallMaterial
        );
        rightWall.position.set(CONFIG.storeWidth/2, CONFIG.storeHeight/2, 0);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        store.add(rightWall);

        // 后墙
        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(CONFIG.storeWidth, CONFIG.storeHeight, 0.2),
            wallMaterial
        );
        backWall.position.set(0, CONFIG.storeHeight/2, -CONFIG.storeDepth/2);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        store.add(backWall);

        // 底部装饰条
        const baseStripe = new THREE.Mesh(
            new THREE.BoxGeometry(CONFIG.storeWidth, 0.3, 0.25),
            accentMaterial
        );
        baseStripe.position.set(0, 0.15, CONFIG.storeDepth/2);
        store.add(baseStripe);

        // 顶部装饰条
        const topStripe = new THREE.Mesh(
            new THREE.BoxGeometry(CONFIG.storeWidth, 0.3, 0.25),
            accentMaterial
        );
        topStripe.position.set(0, CONFIG.storeHeight - 0.15, CONFIG.storeDepth/2);
        store.add(topStripe);

        // 角落装饰柱
        const pillarGeometry = new THREE.BoxGeometry(0.3, CONFIG.storeHeight, 0.3);

        const pillar1 = new THREE.Mesh(pillarGeometry, accentMaterial);
        pillar1.position.set(-CONFIG.storeWidth/2 + 0.15, CONFIG.storeHeight/2, CONFIG.storeDepth/2 - 0.15);
        store.add(pillar1);

        const pillar2 = new THREE.Mesh(pillarGeometry, accentMaterial);
        pillar2.position.set(CONFIG.storeWidth/2 - 0.15, CONFIG.storeHeight/2, CONFIG.storeDepth/2 - 0.15);
        store.add(pillar2);
    }

    // 创建玻璃橱窗
    function createGlassWindows(store) {
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: CONFIG.colors.glass,
            transparent: true,
            opacity: 0.3,
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.9,
            thickness: 0.1
        });

        // 正面大玻璃窗（左侧）
        const leftWindow = new THREE.Mesh(
            new THREE.PlaneGeometry(3.5, 2.5),
            glassMaterial
        );
        leftWindow.position.set(-2, 1.7, CONFIG.storeDepth/2 - 0.01);
        store.add(leftWindow);

        // 正面大玻璃窗（右侧）
        const rightWindow = new THREE.Mesh(
            new THREE.PlaneGeometry(3.5, 2.5),
            glassMaterial
        );
        rightWindow.position.set(2, 1.7, CONFIG.storeDepth/2 - 0.01);
        store.add(rightWindow);

        // 自动门玻璃
        const doorGlass = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, 2.5),
            glassMaterial
        );
        doorGlass.position.set(0, 1.7, CONFIG.storeDepth/2 - 0.01);
        doorGlass.name = 'doorGlass';
        store.add(doorGlass);

        // 门框
        const doorFrame = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 2.6, 0.1),
            new THREE.MeshStandardMaterial({ color: CONFIG.colors.metal })
        );
        doorFrame.position.set(0, 1.7, CONFIG.storeDepth/2);
        store.add(doorFrame);

        // 门分隔线
        const doorDivider = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 2.6, 0.12),
            new THREE.MeshStandardMaterial({ color: CONFIG.colors.metal })
        );
        doorDivider.position.set(0, 1.7, CONFIG.storeDepth/2 + 0.01);
        doorDivider.name = 'doorDivider';
        store.add(doorDivider);

        // 添加门的动画
        animatables.push({
            type: 'door',
            object: doorDivider,
            position: doorDivider.position.clone(),
            open: false
        });
    }

    // 创建屋顶和雨棚
    function createRoof(store) {
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG.colors.concrete,
            roughness: 0.7,
            metalness: 0.1
        });

        // 主屋顶
        const roof = new THREE.Mesh(
            new THREE.BoxGeometry(CONFIG.storeWidth + 0.5, 0.3, CONFIG.storeDepth + 1),
            roofMaterial
        );
        roof.position.set(0, CONFIG.storeHeight + 0.15, -0.25);
        roof.castShadow = true;
        store.add(roof);

        // 雨棚
        const awning = new THREE.Mesh(
            new THREE.BoxGeometry(CONFIG.storeWidth + 0.5, 0.2, 2),
            roofMaterial
        );
        awning.position.set(0, CONFIG.storeHeight + 0.1, CONFIG.storeDepth/2 + 1);
        awning.castShadow = true;
        store.add(awning);

        // 雨棚支撑
        const supportGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.15);
        const supportMaterial = new THREE.MeshStandardMaterial({ color: CONFIG.colors.metal });

        const support1 = new THREE.Mesh(supportGeometry, supportMaterial);
        support1.position.set(-CONFIG.storeWidth/2 + 0.2, CONFIG.storeHeight + 0.2, CONFIG.storeDepth/2 + 1.9);
        store.add(support1);

        const support2 = new THREE.Mesh(supportGeometry, supportMaterial);
        support2.position.set(CONFIG.storeWidth/2 - 0.2, CONFIG.storeHeight + 0.2, CONFIG.storeDepth/2 + 1.9);
        store.add(support2);
    }

    // 创建室内陈设
    function createInterior(store) {
        const interior = new THREE.Group();
        interior.name = 'interior';

        // 地板
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(CONFIG.storeWidth - 0.5, CONFIG.storeDepth - 0.5),
            new THREE.MeshStandardMaterial({
                color: 0xeeeeee,
                roughness: 0.4,
                metalness: 0.1
            })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0.02, 0);
        interior.add(floor);

        // 地面导视线条
        createFloorGuides(interior);

        // 货架
        createShelves(interior);

        // 饮料柜
        createDrinkCoolers(interior);

        // 收银台
        createCashier(interior);

        // 杂志架
        createMagazineRack(interior);

        // 关东煮柜台
        createOdenCounter(interior);

        // 海报和灯箱
        createPosters(interior);

        store.add(interior);
    }

    // 创建地面导视线条
    function createFloorGuides(interior) {
        const lineMaterial = new THREE.MeshBasicMaterial({
            color: CONFIG.colors.storeAccent,
            transparent: true,
            opacity: 0.6
        });

        // 主通道线
        const mainLine = new THREE.Mesh(
            new THREE.PlaneGeometry(0.1, CONFIG.storeDepth - 1),
            lineMaterial
        );
        mainLine.rotation.x = -Math.PI / 2;
        mainLine.position.set(0, 0.03, 0);
        interior.add(mainLine);

        // 横向线
        const crossLine = new THREE.Mesh(
            new THREE.PlaneGeometry(CONFIG.storeWidth - 1, 0.1),
            lineMaterial
        );
        crossLine.rotation.x = -Math.PI / 2;
        crossLine.position.set(0, 0.03, 1);
        interior.add(crossLine);
    }

    // 创建货架
    function createShelves(interior) {
        const shelfMaterial = new THREE.MeshStandardMaterial({
            color: 0xdddddd,
            roughness: 0.5,
            metalness: 0.2
        });

        const productColors = [
            0xff6b6b, 0xffd93d, 0x51cf66, 0x3a86ff, 0x9b59b6,
            0xff9f43, 0x00d2d3, 0xee5a24
        ];

        // 左侧货架组
        for (let i = 0; i < 3; i++) {
            const shelf = createSingleShelf(shelfMaterial, productColors);
            shelf.position.set(-3, 0, -1.5 + i * 1.5);
            shelf.rotation.y = Math.PI / 2;
            interior.add(shelf);
        }

        // 右侧货架组
        for (let i = 0; i < 3; i++) {
            const shelf = createSingleShelf(shelfMaterial, productColors);
            shelf.position.set(3, 0, -1.5 + i * 1.5);
            shelf.rotation.y = -Math.PI / 2;
            interior.add(shelf);
        }
    }

    // 创建单个货架
    function createSingleShelf(material, colors) {
        const shelf = new THREE.Group();

        // 货架框架
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 2, 1.2),
            material
        );
        shelf.add(frame);

        // 层板
        for (let i = 0; i < 4; i++) {
            const layer = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.05, 1.2),
                material
            );
            layer.position.set(0.3, 0.3 + i * 0.45, 0);
            shelf.add(layer);

            // 商品
            for (let j = 0; j < 5; j++) {
                const product = new THREE.Mesh(
                    new THREE.BoxGeometry(0.08, 0.25, 0.08),
                    new THREE.MeshStandardMaterial({
                        color: colors[(i + j) % colors.length],
                        roughness: 0.5,
                        metalness: 0.1,
                        emissive: colors[(i + j) % colors.length],
                        emissiveIntensity: 0.1
                    })
                );
                product.position.set(0.15 + j * 0.1, 0.45 + i * 0.45, (Math.random() - 0.5) * 0.8);
                shelf.add(product);
            }
        }

        return shelf;
    }

    // 创建饮料柜
    function createDrinkCoolers(interior) {
        const coolerMaterial = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            roughness: 0.3,
            metalness: 0.4
        });

        const drinkColors = [0x00d4ff, 0xff6b6b, 0xffd93d, 0x51cf66, 0x3a86ff];

        // 后墙饮料柜
        const backCooler = new THREE.Group();

        // 柜体
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2.2, 0.8),
            coolerMaterial
        );
        body.position.set(0, 1.1, -2.4);
        backCooler.add(body);

        // 玻璃门
        const glass = new THREE.Mesh(
            new THREE.PlaneGeometry(2.8, 2),
            new THREE.MeshPhysicalMaterial({
                color: 0x88ccff,
                transparent: true,
                opacity: 0.4,
                roughness: 0.1
            })
        );
        glass.position.set(0, 1.1, -2.01);
        backCooler.add(glass);

        // 饮料瓶
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 8; j++) {
                const bottle = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8),
                    new THREE.MeshStandardMaterial({
                        color: drinkColors[(i + j) % drinkColors.length],
                        roughness: 0.3,
                        metalness: 0.3,
                        emissive: drinkColors[(i + j) % drinkColors.length],
                        emissiveIntensity: 0.2
                    })
                );
                bottle.position.set(-1.2 + j * 0.3, 0.5 + i * 0.5, -2.3);
                backCooler.add(bottle);
            }
        }

        interior.add(backCooler);
    }

    // 创建收银台
    function createCashier(interior) {
        const counterMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5f5f5,
            roughness: 0.5,
            metalness: 0.1
        });

        const counter = new THREE.Group();

        // 收银台主体
        const main = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1, 0.8),
            counterMaterial
        );
        main.position.set(0, 0.5, 2);
        counter.add(main);

        // 收银机
        const register = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.3, 0.3),
            new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.4,
                metalness: 0.6
            })
        );
        register.position.set(0.3, 1.15, 2);
        counter.add(register);

        // 收银机屏幕（发光）
        const screen = new THREE.Mesh(
            new THREE.PlaneGeometry(0.25, 0.2),
            new THREE.MeshBasicMaterial({
                color: 0x00ff88,
                transparent: true,
                opacity: 0.9
            })
        );
        screen.position.set(0.3, 1.25, 2.16);
        screen.rotation.x = -Math.PI / 8;
        counter.add(screen);

        // 小商品展示
        for (let i = 0; i < 6; i++) {
            const item = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.15, 0.1),
                new THREE.MeshStandardMaterial({
                    color: [0xff6b6b, 0xffd93d, 0x51cf66][i % 3],
                    emissive: [0xff6b6b, 0xffd93d, 0x51cf66][i % 3],
                    emissiveIntensity: 0.3
                })
            );
            item.position.set(-0.8 + i * 0.2, 1.08, 2.3);
            counter.add(item);
        }

        interior.add(counter);
    }

    // 创建杂志架
    function createMagazineRack(interior) {
        const rack = new THREE.Group();

        const rackMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.5,
            metalness: 0.3
        });

        // 架子框架
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 1.8, 0.4),
            rackMaterial
        );
        frame.position.set(-3.2, 0.9, 2);
        rack.add(frame);

        // 杂志
        const magazineColors = [0xff6b6b, 0x3a86ff, 0xffd93d, 0x51cf66, 0x9b59b6];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 4; j++) {
                const mag = new THREE.Mesh(
                    new THREE.BoxGeometry(0.2, 0.3, 0.02),
                    new THREE.MeshStandardMaterial({
                        color: magazineColors[(i + j) % magazineColors.length],
                        roughness: 0.7,
                        metalness: 0.1,
                        emissive: magazineColors[(i + j) % magazineColors.length],
                        emissiveIntensity: 0.15
                    })
                );
                mag.position.set(-3.2 - 0.15 + j * 0.25, 0.5 + i * 0.5, 2.21);
                mag.rotation.x = -Math.PI / 12;
                rack.add(mag);
            }
        }

        interior.add(rack);
    }

    // 创建关东煮柜台
    function createOdenCounter(interior) {
        const counter = new THREE.Group();

        // 柜台主体
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.2, 0.8),
            new THREE.MeshStandardMaterial({
                color: 0xf5f5f5,
                roughness: 0.5,
                metalness: 0.1
            })
        );
        body.position.set(3.2, 0.6, 2);
        counter.add(body);

        // 关东煮锅
        const pot = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.35, 0.3, 16),
            new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.3,
                metalness: 0.6
            })
        );
        pot.position.set(3.2, 1.35, 2);
        counter.add(pot);

        // 汤（发光效果，表示热气）
        const soup = new THREE.Mesh(
            new THREE.CircleGeometry(0.28, 16),
            new THREE.MeshBasicMaterial({
                color: 0xffd93d,
                transparent: true,
                opacity: 0.8
            })
        );
        soup.position.set(3.2, 1.51, 2);
        soup.rotation.x = -Math.PI / 2;
        counter.add(soup);

        // 食物串
        const skewerColors = [0xff6b6b, 0xffd93d, 0x51cf66, 0xff9f43];
        for (let i = 0; i < 6; i++) {
            const skewer = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8),
                new THREE.MeshStandardMaterial({ color: 0x8b4513 })
            );
            skewer.position.set(3.2, 1.65, 2);
            skewer.rotation.x = Math.PI / 6 + Math.random() * 0.2;
            skewer.rotation.z = (Math.PI / 3) * i;
            counter.add(skewer);

            // 食物球
            const food = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 8, 8),
                new THREE.MeshStandardMaterial({
                    color: skewerColors[i % skewerColors.length],
                    roughness: 0.5
                })
            );
            const angle = (Math.PI / 3) * i;
            food.position.set(
                3.2 + Math.sin(angle) * 0.1,
                1.7,
                2 + Math.cos(angle) * 0.1
            );
            counter.add(food);
        }

        interior.add(counter);
    }

    // 创建海报和灯箱
    function createPosters(interior) {
        // 店内海报
        const posterColors = [0xff6b6b, 0x3a86ff, 0xffd93d, 0x51cf66];

        // 后墙海报
        for (let i = 0; i < 3; i++) {
            const poster = new THREE.Mesh(
                new THREE.PlaneGeometry(0.8, 1.2),
                new THREE.MeshStandardMaterial({
                    color: posterColors[i],
                    emissive: posterColors[i],
                    emissiveIntensity: 0.3
                })
            );
            poster.position.set(-2 + i * 2, 2, -2.89);
            interior.add(poster);
        }

        // 顶部灯箱
        const lightBox = new THREE.Mesh(
            new THREE.BoxGeometry(4, 0.5, 1),
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: CONFIG.colors.indoorLight,
                emissiveIntensity: 0.8
            })
        );
        lightBox.position.set(0, 3.2, 0);
        interior.add(lightBox);

        // 室内点光源
        const indoorSpot = new THREE.PointLight(CONFIG.colors.indoorLight, 0.8, 8);
        indoorSpot.position.set(0, 3, 0);
        interior.add(indoorSpot);
    }

    // 创建招牌
    function createSignage(store) {
        const signs = new THREE.Group();

        // 主招牌（屋顶）
        const mainSign = new THREE.Mesh(
            new THREE.BoxGeometry(5, 0.8, 0.2),
            new THREE.MeshStandardMaterial({
                color: CONFIG.colors.neonBlue,
                emissive: CONFIG.colors.neonBlue,
                emissiveIntensity: 1
            })
        );
        mainSign.position.set(0, CONFIG.storeHeight + 0.5, CONFIG.storeDepth/2 + 1.5);
        signs.add(mainSign);

        // 招牌文字区域（简化为发光块）
        const text1 = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.4, 0.1),
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 1.5
            })
        );
        text1.position.set(-1.5, CONFIG.storeHeight + 0.5, CONFIG.storeDepth/2 + 1.65);
        signs.add(text1);

        const text2 = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.4, 0.1),
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 1.5
            })
        );
        text2.position.set(1.5, CONFIG.storeHeight + 0.5, CONFIG.storeDepth/2 + 1.65);
        signs.add(text2);

        // 侧招牌
        const sideSign = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 1.5, 1),
            new THREE.MeshStandardMaterial({
                color: CONFIG.colors.neonRed,
                emissive: CONFIG.colors.neonRed,
                emissiveIntensity: 0.8
            })
        );
        sideSign.position.set(-CONFIG.storeWidth/2 - 0.3, 2, CONFIG.storeDepth/2 + 1);
        signs.add(sideSign);

        // 添加闪烁动画
        animatables.push({
            type: 'flicker',
            object: mainSign.material,
            intensity: 1,
            speed: 3
        });

        animatables.push({
            type: 'flicker',
            object: sideSign.material,
            intensity: 0.8,
            speed: 2
        });

        store.add(signs);
    }

    // 创建室外元素
    function createOutdoorElements() {
        createVendingMachine();
        createBicycle();
        createStreetLamp();
        createPowerPole();
        createTrashBin();
        createUmbrellaStand();
        createRoadSign();
        createGuardRail();
        createParkingSpace();
        createAirConditioner();
        createBulletinBoard();
    }

    // 创建自动贩卖机
    function createVendingMachine() {
        const vending = new THREE.Group();

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(1, 2, 0.8),
            new THREE.MeshStandardMaterial({
                color: 0x3a86ff,
                roughness: 0.4,
                metalness: 0.3
            })
        );
        body.position.set(-6, 1, 3);
        vending.add(body);

        // 玻璃面板
        const glass = new THREE.Mesh(
            new THREE.PlaneGeometry(0.8, 1.5),
            new THREE.MeshPhysicalMaterial({
                color: 0x88ccff,
                transparent: true,
                opacity: 0.5,
                roughness: 0.1
            })
        );
        glass.position.set(-6, 1.2, 3.41);
        vending.add(glass);

        // 饮料展示
        const drinkColors = [0xff6b6b, 0x00d4ff, 0xffd93d, 0x51cf66];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 5; j++) {
                const drink = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8),
                    new THREE.MeshStandardMaterial({
                        color: drinkColors[(i + j) % drinkColors.length],
                        emissive: drinkColors[(i + j) % drinkColors.length],
                        emissiveIntensity: 0.3
                    })
                );
                drink.position.set(-6.2 + j * 0.15, 0.6 + i * 0.4, 3.3);
                vending.add(drink);
            }
        }

        // 按钮面板
        const panel = new THREE.Mesh(
            new THREE.PlaneGeometry(0.8, 0.3),
            new THREE.MeshStandardMaterial({
                color: 0x333333,
                emissive: 0x00ff88,
                emissiveIntensity: 0.5
            })
        );
        panel.position.set(-6, 0.2, 3.41);
        vending.add(panel);

        scene.add(vending);
    }

    // 创建自行车
    function createBicycle() {
        const bike = new THREE.Group();

        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a86ff,
            roughness: 0.4,
            metalness: 0.6
        });

        // 车架（简化）
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.6, 1.2),
            frameMaterial
        );
        frame.position.set(5, 0.6, 5);
        frame.rotation.y = Math.PI / 6;
        bike.add(frame);

        // 车轮
        const wheelGeometry = new THREE.TorusGeometry(0.35, 0.03, 8, 16);

        const wheel1 = new THREE.Mesh(wheelGeometry, frameMaterial);
        wheel1.position.set(5, 0.35, 4.5);
        wheel1.rotation.y = Math.PI / 6;
        bike.add(wheel1);

        const wheel2 = new THREE.Mesh(wheelGeometry, frameMaterial);
        wheel2.position.set(5.3, 0.35, 5.5);
        wheel2.rotation.y = Math.PI / 6;
        bike.add(wheel2);

        // 车座
        const seat = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.1, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        seat.position.set(5.1, 0.95, 5.1);
        bike.add(seat);

        scene.add(bike);
    }

    // 创建路灯
    function createStreetLamp() {
        const lamp = new THREE.Group();

        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.6,
            metalness: 0.7
        });

        // 灯柱
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.12, 5, 8),
            poleMaterial
        );
        pole.position.set(6, 2.5, 5);
        lamp.add(pole);

        // 灯头
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            new THREE.MeshStandardMaterial({
                color: 0xffffcc,
                emissive: 0xffddaa,
                emissiveIntensity: 1.5
            })
        );
        head.position.set(6, 5.2, 5);
        lamp.add(head);

        // 灯罩
        const shade = new THREE.Mesh(
            new THREE.ConeGeometry(0.5, 0.4, 8, 1, true),
            poleMaterial
        );
        shade.position.set(6, 5.4, 5);
        lamp.add(shade);

        scene.add(lamp);
    }

    // 创建电线杆
    function createPowerPole() {
        const pole = new THREE.Group();

        const woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a3728,
            roughness: 0.8
        });

        // 电线杆主体
        const main = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.2, 6, 8),
            woodMaterial
        );
        main.position.set(-6, 3, -6);
        pole.add(main);

        // 横臂
        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.15, 0.15),
            woodMaterial
        );
        arm.position.set(-6, 5.5, -6);
        pole.add(arm);

        // 电线
        createPowerLines(pole);

        scene.add(pole);
    }

    // 创建电线
    function createPowerLines(pole) {
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x111111 });

        // 到便利店的电线
        const points1 = [
            new THREE.Vector3(-4.5, 5.5, -6),
            new THREE.Vector3(-2, 4.2, 3),
            new THREE.Vector3(0, 4.2, 3)
        ];
        const curve1 = new THREE.CatmullRomCurve3(points1);
        const geometry1 = new THREE.TubeGeometry(curve1, 20, 0.02, 8, false);
        const line1 = new THREE.Mesh(geometry1, new THREE.MeshBasicMaterial({ color: 0x111111 }));
        pole.add(line1);

        // 到另一个方向的电线
        const points2 = [
            new THREE.Vector3(-7.5, 5.5, -6),
            new THREE.Vector3(-8, 5.5, -2)
        ];
        const curve2 = new THREE.CatmullRomCurve3(points2);
        const geometry2 = new THREE.TubeGeometry(curve2, 10, 0.02, 8, false);
        const line2 = new THREE.Mesh(geometry2, new THREE.MeshBasicMaterial({ color: 0x111111 }));
        pole.add(line2);
    }

    // 创建垃圾桶
    function createTrashBin() {
        const bin = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.25, 0.9, 8),
            new THREE.MeshStandardMaterial({
                color: 0x228b22,
                roughness: 0.6,
                metalness: 0.3
            })
        );
        bin.position.set(-5.5, 0.45, 5);
        scene.add(bin);

        // 另一个垃圾桶
        const bin2 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.25, 0.9, 8),
            new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.6,
                metalness: 0.3
            })
        );
        bin2.position.set(-6, 0.45, 5);
        scene.add(bin2);
    }

    // 创建雨伞架
    function createUmbrellaStand() {
        const stand = new THREE.Group();

        // 架子
        const rack = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.4, 0.8, 8, 1, true),
            new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.5,
                metalness: 0.4
            })
        );
        stand.add(rack);

        // 底部
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.45, 0.45, 0.1, 8),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        base.position.y = -0.35;
        stand.add(base);

        // 雨伞
        for (let i = 0; i < 3; i++) {
            const umbrella = new THREE.Mesh(
                new THREE.ConeGeometry(0.15, 0.5, 8, 1, true),
                new THREE.MeshStandardMaterial({
                    color: [0xff6b6b, 0x3a86ff, 0xffd93d][i],
                    roughness: 0.5
                })
            );
            umbrella.position.set(
                Math.cos(i * Math.PI * 2 / 3) * 0.15,
                0.15,
                Math.sin(i * Math.PI * 2 / 3) * 0.15
            );
            stand.add(umbrella);
        }

        stand.position.set(5, 0.4, 3.5);
        scene.add(stand);
    }

    // 创建路牌
    function createRoadSign() {
        const sign = new THREE.Group();

        // 杆子
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 3, 8),
            new THREE.MeshStandardMaterial({
                color: 0x666666,
                roughness: 0.5,
                metalness: 0.6
            })
        );
        pole.position.set(0, 1.5, 0);
        sign.add(pole);

        // 牌子
        const plate = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.6, 0.05),
            new THREE.MeshStandardMaterial({
                color: 0x228b22,
                emissive: 0x228b22,
                emissiveIntensity: 0.3
            })
        );
        plate.position.set(0.5, 2.7, 0);
        sign.add(plate);

        sign.position.set(7, 0, -7);
        sign.rotation.y = Math.PI / 4;
        scene.add(sign);
    }

    // 创建护栏
    function createGuardRail() {
        const rail = new THREE.Group();
        const railMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd93d,
            roughness: 0.5,
            metalness: 0.4
        });

        // 护栏杆
        for (let i = 0; i < 5; i++) {
            const post = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 1, 8),
                new THREE.MeshStandardMaterial({ color: 0x333333 })
            );
            post.position.set(i * 0.8, 0.5, 0);
            rail.add(post);

            // 警示条纹
            const stripe = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 0.3, 0.08),
                railMaterial
            );
            stripe.position.set(i * 0.8, 0.8, 0);
            rail.add(stripe);
        }

        // 横杆
        const bar = new THREE.Mesh(
            new THREE.BoxGeometry(4, 0.1, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        bar.position.set(1.6, 0.3, 0);
        rail.add(bar);

        rail.position.set(5, 0, -6);
        rail.rotation.y = Math.PI / 3;
        scene.add(rail);
    }

    // 创建停车位
    function createParkingSpace() {
        // 停车位标线
        const lineMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.7
        });

        // 停车位框
        const line1 = new THREE.Mesh(
            new THREE.PlaneGeometry(0.1, 3),
            lineMaterial
        );
        line1.rotation.x = -Math.PI / 2;
        line1.position.set(7, 0.02, 6.5);
        scene.add(line1);

        const line2 = new THREE.Mesh(
            new THREE.PlaneGeometry(0.1, 3),
            lineMaterial
        );
        line2.rotation.x = -Math.PI / 2;
        line2.position.set(8.5, 0.02, 6.5);
        scene.add(line2);

        const line3 = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, 0.1),
            lineMaterial
        );
        line3.rotation.x = -Math.PI / 2;
        line3.position.set(7.75, 0.02, 8);
        scene.add(line3);
    }

    // 创建空调外机
    function createAirConditioner() {
        const ac = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.8, 0.4),
            new THREE.MeshStandardMaterial({
                color: 0xeeeeee,
                roughness: 0.5,
                metalness: 0.2
            })
        );
        ac.position.set(-CONFIG.storeWidth/2 - 0.6, 2.5, -2);
        scene.add(ac);

        // 支架
        const bracket = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.6, 0.8),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        bracket.position.set(-CONFIG.storeWidth/2 - 0.6, 2.2, -2);
        scene.add(bracket);
    }

    // 创建公告栏
    function createBulletinBoard() {
        const board = new THREE.Group();

        // 框架
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.2, 0.1),
            new THREE.MeshStandardMaterial({
                color: 0x8b4513,
                roughness: 0.7
            })
        );
        board.add(frame);

        // 公告内容（色块表示）
        const posterColors = [0xff6b6b, 0x3a86ff, 0xffd93d];
        for (let i = 0; i < 3; i++) {
            const poster = new THREE.Mesh(
                new THREE.PlaneGeometry(0.4, 0.5),
                new THREE.MeshStandardMaterial({
                    color: posterColors[i],
                    emissive: posterColors[i],
                    emissiveIntensity: 0.2
                })
            );
            poster.position.set(-0.4 + i * 0.4, 0.1, 0.06);
            board.add(poster);
        }

        board.position.set(7, 1.2, -3);
        board.rotation.y = -Math.PI / 6;
        scene.add(board);
    }

    // 创建雨滴效果
    function createRain() {
        const rainCount = 5000;
        const rainGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(rainCount * 3);
        const velocities = new Float32Array(rainCount);

        for (let i = 0; i < rainCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * CONFIG.baseSize * 2;
            positions[i * 3 + 1] = Math.random() * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * CONFIG.baseSize * 2;
            velocities[i] = 0.5 + Math.random() * 0.5;
        }

        rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        rainGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));

        const rainMaterial = new THREE.PointsMaterial({
            color: CONFIG.colors.rain,
            size: 0.05,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        rainParticles = new THREE.Points(rainGeometry, rainMaterial);
        scene.add(rainParticles);

        // 添加雨滴动画
        animatables.push({
            type: 'rain',
            object: rainParticles
        });
    }

    // 创建积水反射
    function createReflections() {
        // 积水区域
        const puddleGeometry = new THREE.CircleGeometry(1.5, 32);
        const puddleMaterial = new THREE.MeshStandardMaterial({
            color: 0x222244,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.7
        });

        // 主积水
        const puddle1 = new THREE.Mesh(puddleGeometry, puddleMaterial);
        puddle1.rotation.x = -Math.PI / 2;
        puddle1.position.set(-3, 0.02, 4);
        scene.add(puddle1);

        const puddle2 = new THREE.Mesh(
            new THREE.CircleGeometry(0.8, 32),
            puddleMaterial.clone()
        );
        puddle2.rotation.x = -Math.PI / 2;
        puddle2.position.set(4, 0.02, -3);
        scene.add(puddle2);

        // 波纹动画
        animatables.push({
            type: 'puddle',
            object: puddle1,
            time: 0
        });

        animatables.push({
            type: 'puddle',
            object: puddle2,
            time: Math.PI
        });

        // 屋檐滴水效果
        createDripEffect();
    }

    // 屋檐滴水
    function createDripEffect() {
        const dripCount = 20;
        const dripGeometry = new THREE.SphereGeometry(0.03, 8, 8);
        const dripMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.8,
            emissive: 0xaaddff,
            emissiveIntensity: 0.3
        });

        for (let i = 0; i < dripCount; i++) {
            const drip = new THREE.Mesh(dripGeometry, dripMaterial);
            drip.position.set(
                (Math.random() - 0.5) * CONFIG.storeWidth,
                CONFIG.storeHeight + 0.2,
                CONFIG.storeDepth/2 + 2
            );
            drip.visible = false;
            scene.add(drip);

            animatables.push({
                type: 'drip',
                object: drip,
                startTime: Math.random() * 3,
                duration: 0.5,
                active: false,
                startPos: drip.position.clone()
            });
        }
    }

    // 窗口调整
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // 动画循环
    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        // 更新控制器
        controls.update();

        // 更新所有动画
        updateAnimations(elapsed, delta);

        // 渲染
        renderer.render(scene, camera);
    }

    // 更新动画
    function updateAnimations(time, delta) {
        animatables.forEach(anim => {
            switch (anim.type) {
                case 'rain':
                    updateRain(anim.object, delta);
                    break;
                case 'flicker':
                    updateFlicker(anim, time);
                    break;
                case 'door':
                    updateDoor(anim, time);
                    break;
                case 'puddle':
                    updatePuddle(anim, time);
                    break;
                case 'drip':
                    updateDrip(anim, time, delta);
                    break;
            }
        });
    }

    // 更新雨滴
    function updateRain(rain, delta) {
        const positions = rain.geometry.attributes.position.array;
        const velocities = rain.geometry.attributes.velocity.array;

        for (let i = 0; i < positions.length / 3; i++) {
            positions[i * 3 + 1] -= velocities[i] * delta * 15;

            if (positions[i * 3 + 1] < 0) {
                positions[i * 3 + 1] = 20;
                positions[i * 3] = (Math.random() - 0.5) * CONFIG.baseSize * 2;
                positions[i * 3 + 2] = (Math.random() - 0.5) * CONFIG.baseSize * 2;
            }
        }

        rain.geometry.attributes.position.needsUpdate = true;
    }

    // 更新灯光闪烁
    function updateFlicker(anim, time) {
        const flicker = Math.sin(time * anim.speed * 10) * 0.1 +
                        Math.sin(time * anim.speed * 23) * 0.05;

        if (anim.object.isPointLight) {
            anim.object.intensity = anim.intensity * (1 + flicker);
        } else if (anim.object.isMaterial) {
            anim.object.emissiveIntensity = anim.intensity * (1 + flicker);
        }
    }

    // 更新自动门
    function updateDoor(anim, time) {
        // 每5秒开关一次
        const cycle = time % 5;

        if (cycle > 4 && !anim.open) {
            // 门打开
            anim.open = true;
        } else if (cycle < 4 && anim.open) {
            // 门关闭
            anim.open = false;
        }

        // 动画门的位置（简化为移动分隔线）
        const targetX = anim.open ? 0.4 : 0;
        anim.object.position.x += (targetX - anim.object.position.x) * 0.1;
    }

    // 更新积水波纹
    function updatePuddle(anim, time) {
        const scale = 1 + Math.sin(time * 2 + anim.time) * 0.02;
        anim.object.scale.set(scale, scale, 1);
    }

    // 更新滴水
    function updateDrip(anim, time, delta) {
        const cycleTime = time % 3;

        if (cycleTime < anim.startTime && !anim.active) {
            return;
        }

        if (!anim.active) {
            anim.active = true;
            anim.object.visible = true;
            anim.object.position.copy(anim.startPos);
        }

        // 水滴下落
        anim.object.position.y -= delta * 10;

        // 水滴消失
        if (anim.object.position.y < 0) {
            anim.active = false;
            anim.object.visible = false;
        }
    }

    // 启动
    init();

})();
