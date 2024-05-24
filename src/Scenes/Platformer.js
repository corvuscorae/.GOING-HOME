class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    preload(){
        // animated tiles plugin
        // https://github.com/jonit-dev/phaser-animated-tiles
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles')
    }

    init() {
        // variables and settings
        this.ACCELERATION = 500;
        this.DRAG = 6000;    // DRAG < ACCELERATION = icy slide
        this.GRAVITY = 2000;
        this.physics.world.gravity.y = this.GRAVITY;
        this.JUMP_VELOCITY = -600;
        this.SCALE = 2.0;

        this.debug = true;
        this.tileType = 0;
        this.onJumpThru = false;
        this.currTile = null;
        this.wait = 0;

        this.keyCount = 0;
        this.heartCount = 0;
        this.heartsFilled = 0;
        this.shroombustCount = 0;

        this.UFOspeed = 2;
        this.UFOright = -1;

        this.keyUp = 1;

        this.spawnX = game.config.width/10;
        this.spawnY = game.config.height*4 - 100;

        this.currCheckpoint = {x: -100, y: -100};

        this.won = false;

        this.squash = 100;

        // audio stuff
        this.falling = false;
        this.onWater = false;
        this.xMoving = false;
        this.waterLanding = false;
        this.volume_SFX = 0.3;
        this.volume_BGmusic = 0.6;
        
        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();
        this.enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);


        // create map (from tilemap)
        this.map = this.add.tilemap("map-level-1", 18, 18, 30, 90);

        // tilesets
        this.tiles_marble       = this.map.addTilesetImage("packed_marble", "marble");
        this.tiles_stone        = this.map.addTilesetImage("packed_rock", "rock");
        this.tiles_platforms    = this.map.addTilesetImage("packed_tilemap", "platforms");
        this.tiles_industry     = this.map.addTilesetImage("packed_industrial", "industry");
        this.tiles_mountains    = this.map.addTilesetImage("mountains", "mountains");
        this.tiles_background   = this.map.addTilesetImage("tilemap-backgrounds", "backgrounds");

        this.tileSets = [this.tiles_marble, this.tiles_stone, this.tiles_platforms, 
            this.tiles_industry, this.tiles_mountains, this.tiles_background];
    }

///////////////* CREATE() HELPER FCNS *//////////////////
    // AUDIO //
    initAudio(){
        this.bg_music = 
            this.sound.add("bg_music", {
                volume: this.volume_BGmusic,
                rate: 1,
                detune: 0,
                loop: true
            });
        this.bg_music.play();
        this.sfx_walk = 
            this.sound.add("sfx_walk", {
                volume: this.volume_SFX/6,
                rate: 0.8,
                detune: 0,
                loop: false
            });
        this.sfx_jump = 
            this.sound.add("sfx_jump", {
                volume: this.volume_SFX,
                rate: 1,
                detune: -500,
                loop: false
            });
        this.sfx_superjump = 
            this.sound.add("sfx_superjump", {
                volume: this.volume_SFX,
                rate: 1,
                detune: -500,
                loop: false
            });
        this.sfx_land = 
        this.sound.add("sfx_land", {
                volume: this.volume_SFX/3,
                rate: 3,
                detune: 100,
                loop: false
            });
        this.sfx_collectKey = 
            this.sound.add("sfx_collectA", {
                volume: this.volume_SFX,
                rate: 1,
                detune: 0,
                loop: false
            });
        this.sfx_collectDiamond = 
            this.sound.add("sfx_collectB", {
                volume: this.volume_SFX,
                rate: 1,
                detune: 0,
                loop: false
            });
        this.sfx_openChest = 
            this.sound.add("sfx_openChest", {
                volume: this.volume_SFX,
                rate: 2,
                detune: -2000,
                loop: false
            });
        this.sfx_breakShroom = 
            this.sound.add("sfx_breakShroom", {
                volume: this.volume_SFX,
                rate: 1,
                detune: 0,
                loop: false
            });
        this.sfx_swim = 
            this.sound.add("sfx_swim", {
                volume: this.volume_SFX,
                rate: 1,
                detune: 0,
                loop: false
            });   
        this.sfx_checkpointUnlock = 
            this.sound.add("sfx_checkpointUnlock", {
                volume: this.volume_SFX,
                rate: 1,
                detune: 0,
                loop: false
            });   
        this.sfx_checkpointWarp = 
            this.sound.add("sfx_checkpointWarp", {
                volume: this.volume_SFX,
                rate: 1,
                detune: 0,
                loop: false
            });
        this.sfx_getHeart = 
            this.sound.add("sfx_getHeart", {
                volume: this.volume_SFX/1.5,
                rate: 1,
                detune: 0,
                loop: false
            });
        this.sfx_putHeart = [ // array of sounds
            this.sound.add("sfx_putHeart1", {
                volume: this.volume_SFX/1.5,
                rate: 1,
                detune: 0,
                loop: true
            }),        
            this.sound.add("sfx_putHeart2", {
                volume: this.volume_SFX/1.5,
                rate: 1,
                detune: 0,
                loop: true
            }),      
            this.sound.add("sfx_putHeart3", {
                volume: this.volume_SFX/3,
                rate: 1,
                detune: 0,
                loop: true
            })
        ]

        this.sfx_ALL = // lil array to use as a sort of master switch
            [this.sfx_getHeart, this.sfx_putHeart[0], this.sfx_putHeart[1], this.sfx_putHeart[2], 
            this.sfx_checkpointWarp, this.sfx_checkpointUnlock, this.sfx_swim, this.sfx_breakShroom, 
            this.sfx_openChest, this.sfx_collectDiamond, this.sfx_collectKey, this.sfx_land, 
            this.sfx_superjump, this.sfx_jump, this.sfx_walk];
    }   
    // VFX/PARTICLES SYSTEMS //
    initVFX(){
        my.vfx.pickup = this.add.particles(-100, -100, "kenny-particles", {
            frame: ['star_08.png'],
            maxAliveParticles: 1,
            scale: {start: 0.2, end: 0.1},
            lifespan: 100,
            stopAfter: 1
        });
        my.vfx.pickup.stop();

        my.vfx.openChest = this.add.particles(-100,-100, "kenny-particles", {
            frame: ['smoke_06.png', 'smoke_07.png', 'smoke_08.png'],
            scale: {start: 0.1, end: 0.05},
            alpha: {start: 1, end: 0.7},
            lifespan: 100,
            duration: 0.5
        });
        my.vfx.openChest.stop();

        my.vfx.getHeart = this.add.particles(-100,-100, "kenny-particles", {
            frame: ['flare_01.png', 'light_01.png', 'light_03.png', 'light_02.png'],
            random: false,
            scale: {start: 0.2, end: 0.05},
            alpha: {start: 1000, end: 0},
            maxAliveParticles: 2,
            maxParticles: 4,
            lifespan: 100,
            duration: 0.8
        });
        my.vfx.getHeart.stop();

        // on land
        my.vfx.run = this.add.particles(-100,-100, "kenny-particles", {
            frame: ['circle_05.png'],
            scale: {start: 0.005, end: 0.05},
            alpha: {start: 1, end: 0},
            lifespan: 500
        });
        my.vfx.run.stop();

        // underwater
        my.vfx.swim = this.add.particles(-100,-100, "kenny-particles", {
            frame: ['circle_01.png', 'circle_02.png', 'circle_03.png', 'circle_04.png'],
            scale: {start: 0.005, end: 0.05},
            alpha: {start: 1, end: 0},
            lifespan: 500
        });
        my.vfx.run.stop();

        // superjump
        my.vfx.superjump = this.add.particles(-100,-100, "kenny-particles", {
            frame: ['spark_05.png', 'spark_06.png'],
            scale: {start: 0.1, end: 0.05},
            alpha: {start: 0.5, end: 0},
            speedY: -100,
            lifespan: 50,
            duration: 300
        });
        my.vfx.superjump.stop();

        // shroombust
        my.vfx.shroomb = this.add.particles(0, 0, "kenny-particles", {
            frame: ['dirt_01.png', 'dirt_02.png', 'dirt_03.png'],
            random: true,
            scale: {start: 0.08, end: 0.01},
            alpha: {start: 1, end: 0},
            speedY: 100,
            duration: 300
        });
        my.vfx.shroomb.stop();
    }
    /* UI */
    initUI(){
        // INVENTORY
        this.rect_topLeft = this.add.rectangle(0, 0, game.config.width - 120, 200, 0x1c1211, 0.5)
            .setOrigin(0.5).setScrollFactor(0);
        this.keysTxt = this.add.bitmapText(10, 50, "pixel_font", 
            `KEYS:${this.keyCount}`, 30).setScrollFactor(0);

        this.shroombTxt = this.add.bitmapText(10, 10, "pixel_font", 
            `SHROOMBUSTERS:${this.shroombustCount}`, 30).setScrollFactor(0);

        // CONTROLS
        this.rect_bottom = this.add.rectangle(0, game.config.height, game.config.width*2, 60, 0x1c1211, 0.5)
            .setOrigin(0.5).setScrollFactor(0);
        this.controlsTxt = this.add.bitmapText(10, 1050, "pixel_font", 
            `Arrows to move`, 20).setScrollFactor(0);

        this.teleportTxt = this.add.bitmapText(500, 1050, "pixel_font", 
            `Space to return to checkpoint`, 20).setScrollFactor(0).setVisible(false);

        // WIN stuff
        this.rect_win = this.add.rectangle(540, 480, 1040, 300, 0x1c1211, 0.5)
            .setOrigin(0.5).setScrollFactor(0).setVisible(false);
        
        this.winTxt = this.add.bitmapText(540, 540, "pixel_font", 
            `WIN!`, 200).setOrigin(0.5).setScrollFactor(0).setVisible(false);

        this.playagainTxt = this.add.bitmapText(540, 540+60, "pixel_font", 
            `press enter to play again`, 40).setOrigin(0.5).setScrollFactor(0).setVisible(false);
    }
    // CREATE TILE LAYERS //
    addLayer(layerName, tilesets, scroll){
        let newLayer = 
            this.map.createLayer(
                layerName, 
                tilesets, 
                0, 0)
            .setScrollFactor(scroll)
            .setScale(this.SCALE);

        return newLayer;
    }
    // CREATE OBJECT LAYERS //
    addObjectLayer(layerName, objName, keyName, frameNum){
        let newLayer = this.map.createFromObjects(
            layerName, {
            name: objName,
            key: keyName,
            frame: frameNum
        });
        for(let i in newLayer){ // rescale + shift position
            newLayer[i].x *= this.SCALE; 
            newLayer[i].y *= this.SCALE; 
            newLayer[i].setScale(this.SCALE); 
        }

        this.physics.world.enable(newLayer, Phaser.Physics.Arcade.STATIC_BODY);

        return newLayer;
    }
    // TILE LAYERS COLLIDERS //
    initColliders(layer, sprite){
       switch(layer){
        ///-- WATER ------------------------------------///
            case "water":
                this.waterLayer.setCollisionByProperty({
                    waterBody: true, waterFall: true, collides: true
                });
                
                // set up overlap by water type
                this.physics.add.overlap(
                    my.sprite.player,
                    this.waterLayer,
                    (sprite, tile) => {
                        // water type = waterBody
                        if(tile.properties.waterBody == true){ this.tileType = 2; } 
                        else { 
                            // water type = waterFall
                            if(tile.properties.waterFall == true){ this.tileType = 1; } 
                            // not on water
                            else { this.tileType = 0; }
                        }
                    }
                );
            break;
        ///-- PLATFORMS --------------------------------///
            case "platforms":
                this.platformsLayer.setCollisionByProperty({
                    collides: true, jumpThru: false, breakable: true,
                    ladder: false, emptyHeart: true
                });

                // handle tiles by property
                this.physics.add.collider(
                    my.sprite.player, 
                    this.platformsLayer,
                    (sprite, tile) => {
                        if(tile.properties.jumpThru){ // jumpThru tiles
                            // turn off all collisions except for up
                            tile.collideDown = false;
                            tile.collideLeft = false;
                            tile.collideRight = false;
                            
                            // helper variables for moving down through these platforms (see yMovement())
                            this.onJumpThru = true;
                            this.currTile = tile;
                            
                            // update tileType variable
                            if(tile.properties.cloud){ this.tileType = 0.5; }
                            else{ this.tileType = 0; }
                        } else{
                            this.onJumpThru = false;
                            if(tile.properties.breakable){ // breakable tiles --> handle shroombust 
                                // if player has shroombust powerup, "break" block on collision
                                if(this.shroombustCount > 0){
                                    // SFX + VFX
                                    this.sfx_breakShroom.play();
                                    my.vfx.shroomb.x = tile.x*36 + 20;
                                    my.vfx.shroomb.y = tile.y*36 + 10;
                                    my.vfx.shroomb.start();
                                    // UPDATE TILE/VARIABLES
                                    this.shroombustCount--;
                                    tile.setCollision(false);
                                    tile.setVisible(false);
                                    tile.properties.ladder = true;
                                }
                            }
                        }
                    });
                // add overlap for ladder tiles
                this.physics.add.overlap(
                    sprite, 
                    this.platformsLayer,
                    (sprite, tile) => {
                        if(tile.properties.ladder){ 
                            this.tileType = -2; 
                        }
                    });
            break;
       ///-- UFO ---------------------------------------///
            case "UFO":
                this.UFOlayer.setCollisionByProperty({
                    collides: true, UFO: true
                });

                this.physics.add.collider(
                    my.sprite.player, 
                    this.UFOlayer,
                    (sprite, tile) => {
                        sprite.x += 2*this.UFOright; // move sprite with UFO layer
                    }
                );
            break;
        }
       return;
    }
    // OBJECT LAYERS COLLIDERS //
    initObjectColliders(object, sprite){
        switch(object){
        ///-- KEYS -------------------------------------///
            case "keys":
                this.physics.add.overlap(
                    sprite, 
                    this.keyGroup, 
                    (obj1, obj2) => {
                        // SFX + VFX
                        this.sfx_collectKey.play();
                        my.vfx.pickup.x = obj2.x;
                        my.vfx.pickup.y = obj2.y;
                        my.vfx.pickup.start();
                        // UPDATE VARIABLES/OBJECT STATE
                        this.keyCount++;
                        obj2.destroy(); 
                });    
            break;

        ///-- CHESTS -----------------------------------///
            case "chests":
                this.physics.add.collider(
                    sprite, 
                    this.chestGroup, 
                    (obj1, obj2) => {
                        // only can interact with chest if has key
                        if(this.keyCount > 0){
                            // SFX + VFX
                            this.sfx_openChest.play();
                            my.vfx.openChest.x = obj2.x;
                            my.vfx.openChest.y = obj2.y;
                            my.vfx.openChest.start();
                            // UPDATE VARIABLES/OBJECT STATE
                            this.keyCount--;
                            obj2.destroy(); 
                        }
                }); 
            break;

        ///-- SUPERJUMPS -------------------------------///
            case "superjumps":
                this.physics.add.overlap(
                    sprite, 
                    this.superjump, 
                    (obj1, obj2) => {
                        // SFX + VFX
                        this.sfx_superjump.play();
                        my.vfx.superjump.startFollow(my.sprite.player, 105, 150, false);
                        my.vfx.superjump.start();
                        // ANIMS
                        obj2.anims.play('superJump');
                        // make player jump high
                        my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY*2);
                }); 
            break;

        ///-- SHROOMBUSTERS ----------------------------///
            case "shroombuster":
                this.physics.add.overlap(
                    sprite, 
                    this.shroombuster, 
                    (obj1, obj2) => {
                        // SFX + VFX
                        this.sfx_collectDiamond.play();
                        my.vfx.pickup.x = obj2.x;
                        my.vfx.pickup.y = obj2.y;
                        my.vfx.pickup.start();
                        // UPDATE VARIABLES/OBJECT STATE
                        this.shroombustCount++;
                        obj2.destroy(); 
                    });             
            break;

        ///-- HEARTS -----------------------------------///
            case "hearts":
                this.physics.add.overlap(
                    sprite, 
                    this.hearts, 
                    (obj1, obj2) => {
                        // SFX + VFX
                        this.sfx_getHeart.play();
                        my.vfx.getHeart.x = obj2.x;
                        my.vfx.getHeart.y = obj2.y;
                        my.vfx.getHeart.start();
                        // UPDATE VARIABLES/OBJECT STATE
                        this.heartCount++;
                        obj2.destroy(); 
                    }); 
            break;

        ///-- EMPTY HEARTS -----------------------------///
            case "emptyHearts":
            // see emptyHeartsCollider() below
            // NOTE: CANT FIGURE THIS OUT, USING CUSTOM FCN INSTEAD OF BUILT IN >:(
                // collider and overlap acts buggy, doesnt read collision when emptyhearts are moving
                // the custom collision fcn works fine tho so wahoo
            break;

        ///-- CHECKPOINTS ------------------------------///
        case "checkpoints":
            this.physics.add.collider(
                sprite, 
                this.checkpoints, 
                (obj1, obj2) => {
                    // isActive tracks whether the checkpoint has been activated
                    // only do collision callback stuff if the checkpoint hasnt been activated yet
                    if(obj2.isActive == false){
                        // SFX + VFX
                        this.sfx_checkpointUnlock.play();
                        obj2.anims.play('activateCheckpoint');
                        // UPDATE VARIABLES/OBJECT STATE
                        this.currCheckpoint.x = obj2.x;
                        this.currCheckpoint.y = obj2.y;
                        obj2.isActive = true;
                    }
                }); 
            break;
        }
        return;
    }
    // custom collision fcn for empty hearts
    emptyHeartsCollider(player){
        for(let i in this.emptyHearts){ 
            // only check for collision at empty hearts
            if(this.emptyHearts[i].isEmpty == true){ 
                if (Math.abs(this.emptyHearts[i].x - player.x) > 
                    (this.emptyHearts[i].displayWidth/2 + player.displayWidth/2)) { continue; }
                if (Math.abs(this.emptyHearts[i].y - player.y) > 
                    (this.emptyHearts[i].displayHeight/2 + player.displayHeight/2)) { continue; }
                
                // we only reach here if there is a collision. yippie

                // if a heart has already been filled, then stop previous sfx
                if(this.heartsFilled > 0){ this.sfx_putHeart[this.heartsFilled-1].stop(); }
                // play sfx_putHeart member corresponding to numbers of hearts placed atp
                if(!this.sfx_putHeart[this.heartsFilled].isPlaying){ this.sfx_putHeart[this.heartsFilled].play(); }
                this.emptyHearts[i].anims.play('putHeart');

                // set empty flag to false
                this.emptyHearts[i].isEmpty = false;

                this.heartCount--;      // remove heart from player "inventory"
                this.heartsFilled++;    // add heart to heartsFilled score

            }
        }
    }

/////////////////////////////////////////////////////////

    create() {
        this.physics.world.drawDebug = false;
        this.init();

        /* TILE LAYERS */
        this.bgSky = this.addLayer("BG Sky", this.tileSets, 0.95);
        this.bgMountains = this.addLayer("BG Mountains", this.tileSets, 0.75);
        this.bgStuff = this.addLayer("BG Stuff", this.tileSets, 1);
        this.platformsLayer = this.addLayer("Ground + Platforms", this.tileSets, 1);   
        
        // water and UFO layers added below (so they're in front of player!)

        /* OBJECT LAYERS */
        this.keys = this.addObjectLayer("Pickups + Powerups", "key", "tilemap_sheet", 27);
            for(let i in this.keys){ this.keys[i].anims.play('keySway'); }
        this.chests = this.addObjectLayer("Pickups + Powerups", "chest", "tilemap_sheet", 28);
        this.superjump = this.addObjectLayer("Pickups + Powerups", "powerup", "tilemap_sheet", 107);
        this.shroombuster = this.addObjectLayer("Pickups + Powerups", "shroombuster", "tilemap_sheet", 67);
            for(let i in this.shroombuster){ this.shroombuster[i].anims.play('shrmSpin'); }
        this.checkpoints = this.addObjectLayer("Pickups + Powerups", "checkpoint", "tilemap_sheet", 10);
            for(let i in this.checkpoints){ this.checkpoints[i].isActive = false; }
        this.hearts = this.addObjectLayer("Pickups + Powerups", "heart", "tilemap_sheet", 44);
        this.emptyHearts = this.addObjectLayer("Pickups + Powerups", "empty", "tilemap_sheet", 46);
            for(let i in this.emptyHearts){ this.emptyHearts[i].isEmpty = true; this.emptyHearts[i].initX = this.emptyHearts[i].x;}
        
        // helper array for win state to turn these objects invisible upon win
        this.invisObjects_atWin = [this.keys, this.chests, this.superjump, this.shroombuster, this.checkpoints];
        
        /* additional sprite(s) */
        // alien friend in UFO
        this.friend = this.physics.add.staticSprite( // alien in UFO
            game.config.width/2, 
            310,
            "platformer_characters", 
            "tile_0006.png")
            .setScale(this.SCALE - 0.5)
            .setGravity(0);
        // static version of player sprite bc setImmovable is making him flicker for some reason
        this.playerHusk = this.physics.add.staticSprite( // alien in UFO
            game.config.width/2 + 36, 
            310,
            "platformer_characters", 
            "tile_0004.png")
            .setScale(this.SCALE - 0.5)
            .setGravity(0)
            .setVisible(false);

        /* PLAYER */
        // set up player avatar
        //      doing it here to place player behind UFO but in front of object layers
        my.sprite.player = this.physics.add.sprite(
            this.spawnX, 
            this.spawnY,
            "platformer_characters", 
            "tile_0004.png").setScale(this.SCALE - 0.5);
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.setOffset(5,6).setSize(
            my.sprite.player.displayWidth/2.5, 
            my.sprite.player.displayHeight/2,
            false);       

        let sprite = my.sprite.player;
        
        // water tile layer, behind player
        this.waterLayer = this.addLayer("Water + Deco", this.tileSets, 1);
        this.waterLayer.setAlpha(0.3);
        // UFO tile layer, behind player
        this.UFOlayer = this.addLayer("UFO", this.tileSets, 1);

        /* UI LAYER */
        this.initUI();

        // uses the animated tiles plugin to. animate. tiles
        this.animatedTiles.init(this.map)

        /* VFX */
        this.initVFX();

        /* AUDIO */
        this.initAudio();

        /* LAYERS COLLISION */        
        this.layers = ["water","platforms","UFO"];
        for(let layer of this.layers){ this.initColliders(layer, sprite); }

        /* OBJECTS COLLISION */    
        // first, grouping objects  
        this.keyGroup = this.add.group(this.keys);
        this.chestGroup = this.add.group(this.chests);
        this.superjumpGroup = this.add.group(this.superjump);
        this.shroombusterGroup = this.add.group(this.shroombuster);
        this.checkpointsGroup = this.add.group(this.checkpoints);
        this.heartsGroup = this.add.group(this.hearts);
        this.emptyHeartsGroup = this.add.group(this.emptyHearts);

        // then, initializing object collisions
        this.objectGroups = ["keys","chests","superjumps","shroombuster","checkpoints","hearts","emptyHearts"];
        for(let group of this.objectGroups){ this.initObjectColliders(group, sprite); }
        
        /* CAMERA */
        this.cameras.main.setBounds(0,0,this.map.widthInPixels*2,this.map.heightInPixels*2);
        this.cameras.main.startFollow(sprite, 
            true,                   // roundPx
            1, 0.05                 // lerp x, y
        ).setDeadzone(0, game.config.height/4);

        /* set physics bounds */
        this.physics.world.setBounds(0,0,this.map.widthInPixels*2,this.map.heightInPixels*2);

        /* CHECKPOINT TELEPORT LISTENER */
        this.input.keyboard.on('keydown-SPACE', () => {
            if(this.currCheckpoint.x > 0){
                this.sfx_checkpointWarp.play();
                sprite.x = this.currCheckpoint.x;
                sprite.y = this.currCheckpoint.y;
            }
        }, this);
    }
////////////////* UPDATE() HELPER FCNS */////////////////
    xMovement(active){
        if(active){
            if(cursors.left.isDown) {
                // ACCELERATION
                my.sprite.player.body.setAccelerationX(-this.acceleration);

                // SFX
                if(Math.floor(this.tileType) == 0 && !this.sfx_walk.isPlaying && my.sprite.player.body.blocked.down){ 
                    this.sfx_walk.setDetune(-50).play();
                } else if(Math.floor(this.tileType) > 0 && !this.sfx_swim.isPlaying){ this.sfx_swim.setDetune(-100).play(); }
                // ANIMS
                my.sprite.player.resetFlip();
                my.sprite.player.anims.play('walk', true);
                // VFX
                my.vfx.run.startFollow(my.sprite.player, 110, 120, false);
                if (my.sprite.player.body.blocked.down) { my.vfx.run.start(); }
            } else if(cursors.right.isDown) {
                // ACCELERATION
                my.sprite.player.body.setAccelerationX(this.acceleration);

                // SFX
                if(Math.floor(this.tileType) == 0 && !this.sfx_walk.isPlaying && my.sprite.player.body.blocked.down){ 
                    this.sfx_walk.setDetune(150).play();
                } else if(Math.floor(this.tileType) > 0 && !this.sfx_swim.isPlaying){ this.sfx_swim.setDetune(100).play(); }
                // ANIMS
                my.sprite.player.setFlip(true, false);
                my.sprite.player.anims.play('walk', true);
                // VFX
                my.vfx.run.startFollow(my.sprite.player, 90, 120, false);
                if (my.sprite.player.body.blocked.down) { my.vfx.run.start(); }
            } else {
                // ACCELRATION, DRAG
                my.sprite.player.body.setAccelerationX(0);
                my.sprite.player.body.setDragX(this.drag);
                
                // STOP THE JUICE
                this.sfx_walk.stop();
                my.sprite.player.anims.play('idle');
                my.vfx.run.stop();
            }
        }
    }

    yMovement(active){
        if(active){ 
            /* MOVEMENT */
            switch(Math.floor(this.tileType)){
                case 2:     /* UNDWERWATER */     
                    my.vfx.run.stop(); // turn off running VFX
                    if(cursors.up.isDown){
                        // VELOCITY
                        my.sprite.player.body.setVelocityY(-this.acceleration/1.5);
                        // SFX + VFX
                        if(!this.sfx_swim.isPlaying){ this.sfx_swim.setDetune(200).play(); }
                        my.vfx.swim.startFollow(my.sprite.player, 100, 120, false).start();

                    } else if(cursors.down.isDown){
                        // VELOCITY
                        my.sprite.player.body.setVelocityY(this.acceleration/1.5);
                        // SFX + VFX
                        if(!this.sfx_swim.isPlaying){ this.sfx_swim.setDetune(-200).play(); }
                        my.vfx.run.startFollow(my.sprite.player, 100, 120, false).start();
                    } else {
                        my.sprite.player.body.setVelocityY(this.GRAVITY / 200); // sink when idle
                        my.vfx.swim.stop(); // stop VFX
                    }
                    break;
                case 1:     /* WATERFALL */
                    my.vfx.run.stop(); // turn off running VFX
                    if(cursors.up.isDown){
                        // VELOCITY
                        my.sprite.player.body.setVelocityY(-this.acceleration/6);
                        // SFX + VFX
                        if(!this.sfx_swim.isPlaying){ this.sfx_swim.setDetune(200).play(); }
                        my.vfx.run.startFollow(my.sprite.player, 100, 120, false).start();

                    } else if(cursors.down.isDown){
                        // VELOCITY
                        my.sprite.player.body.setVelocityY(this.acceleration/6);
                        // SFX + VFX
                        if(!this.sfx_swim.isPlaying){ this.sfx_swim.setDetune(-200).play(); }
                        my.vfx.run.startFollow(my.sprite.player, 100, 120, false).start();
                    } else {
                        my.sprite.player.body.setVelocityY(this.GRAVITY / 3); // fall when idle
                        my.vfx.swim.stop(); // stop VFX
                    }
                    break;
                case 0:     /* LAND/CLOUDS */
                    my.vfx.swim.stop(); // turn off swimming VFX
                    if( my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
                            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);     
                            this.sfx_jump.play();
                        }    
                    break;
                case -2:    /* LADDER */ 
                    my.vfx.run.stop();  // turn off running VFX
                    my.vfx.swim.stop(); // turn off swimming VFX
                    if(cursors.up.isDown){
                        my.sprite.player.body.setVelocityY(-this.ACCELERATION/2);
                    } else if(cursors.down.isDown){
                        my.sprite.player.body.setVelocityY(this.ACCELERATION/2);
                    } else {
                        my.sprite.player.body.setAccelerationY(0); // no movement when idle
                        my.sprite.player.body.setVelocityY(0);
                    }
                    break;
                }

            /* JUMPTHRU PLATFORM STUFF */
            this.wait--;
            if(cursors.down.isDown && this.onJumpThru == true){
                this.lastTile = this.currTile;
                this.currTile.collideUp = false;
                this.wait = 30;
            }
            if(this.lastTile && this.wait < 0){ 
                this.lastTile.collideUp = true; 
            }

            /* other SFX/VFX + ANIMS */
            if(!my.sprite.player.body.blocked.down) { my.sprite.player.anims.play('jump'); }

            // SFX
            if(my.sprite.player.body.velocity.y > 0){ this.falling = true; }
            if(this.falling == true){
                if(my.sprite.player.body.blocked.down && this.tileType != -2){
                    if(!this.sfx_land.isPlaying){ this.sfx_land.play(); }
                    this.falling = false;
                }
            }
            // stretch when jumping
            if(this.tileType == 0 && my.sprite.player.body.velocity.y < 0) { 
                if(my.sprite.player.body.velocity.y < -800){
                    my.sprite.player.scaleX = this.SCALE - 1; 
                    my.sprite.player.scaleY = this.SCALE + 0.2; 
                }
                else{
                    my.sprite.player.scaleX = this.SCALE - 0.7; 
                    my.sprite.player.scaleY = this.SCALE - 0.2; 
                }
            }
            else{ 
                my.sprite.player.scaleX = this.SCALE - 0.5; 
                my.sprite.player.scaleY = this.SCALE - 0.5; 
            }
        }

    }

    enviroAnims(active){
        if(active){    
            // UFO moves back and forth at top of screen
            let w = game.config.width;
            if(this.UFOlayer.x <= w/2 + 300 && this.UFOright == 1){
                this.UFOlayer.x += this.UFOspeed;
                this.friend.x += this.UFOspeed;
                for(let i in this.emptyHearts){ 
                    this.emptyHearts[i].x += this.UFOspeed; 
                }
                if(this.UFOlayer.x == w/2 + 300){ this.UFOright = -1; }
            }
            else{
                this.UFOlayer.x -= this.UFOspeed;
                this.friend.x -= this.UFOspeed;
                for(let i in this.emptyHearts){ 
                    this.emptyHearts[i].x -= this.UFOspeed; 
                }
                if(this.UFOlayer.x <= -w/2 - 300){ this.UFOright = 1; }
            }

            // have friend look in player's direction
            if(this.friend.x < my.sprite.player.x){ this.friend.setFlip(true, false); }
            else{ this.friend.resetFlip() }

            // heartbeat
            for(let i in this.hearts){
                if(this.hearts[i]._scaleX < this.SCALE + 0.7){
                    this.hearts[i]._scaleX += 0.015;
                    this.hearts[i]._scaleY += 0.015;
                } else{ this.hearts[i].setScale(this.SCALE); }
            }
        }
    }

    win(){
        // make stuff invisible
        this.bgStuff.setAlpha(0);
        for(let layer of this.invisObjects_atWin){ 
            for(let i in layer) layer[i].x = game.config.width*1.5; // puts object layers offscreen
        }

        // put UFO in middle of screen
        this.UFOlayer.x = game.config.width/4 - 270;
        for(let i in this.emptyHearts){ 
            this.emptyHearts[i].x = this.emptyHearts[i].initX; 
        }
        this.friend.x = game.config.width/2;
        this.friend.setFlip(true, false);

        // put "player" in UFO
        //   stop following player sprite, put offscreen, show player husk (placed in UFO in create())
        this.cameras.main.stopFollow(my.sprite.player);
        my.sprite.player.x = -1080; my.sprite.player.y = 1080*5;
        this.playerHusk.setVisible(true);

        // hide game UI
        this.rect_bottom.setVisible(false);
        this.rect_topLeft.setVisible(false);
        this.keysTxt.visible = false;
        this.shroombTxt.visible = false;
        this.controlsTxt.visible = false;
        this.teleportTxt.visible = false;

        // show win UI
        this.rect_win.setVisible(true);
        this.winTxt.setVisible(true); 
        this.playagainTxt.setVisible(true); 

        this.won = true;
        
    }
/////////////////////////////////////////////////////////

    update() {
        // NOTE: tileType (2, 1, 0.5, 0, -2) corresponds to the material that a tile is made of
        //      > can be waterbody, waterfall, clouds, land, or ladder. 
        //      > acceleration and gravity are altered by this variable, as is y-axis movement
        //      > use Math.floor to give clouds the same accelration and gravity as land
        this.acceleration = (
            this.ACCELERATION - 
            (this.ACCELERATION * (Math.abs(Math.floor(this.tileType)) / 3)));
        this.physics.world.gravity.y = (
            this.GRAVITY - 
            (this.GRAVITY * (Math.abs(Math.floor(this.tileType)) / 2)));

        // make clouds icy
        if(this.tileType == 0.5){ this.drag = this.acceleration - 100; }
        else{ this.drag = this.DRAG; }

        // NOTE: win state achieved when heartsFilled == 3 !!!

        // handles x-axis movement (left/right cursor input)
        this.xMovement(!this.won);
        // handles y-axis movement (up/down cursor input) with respect to tileType
        this.yMovement(!this.won);  
         
        // animates UFO, friend, and hearts (aka whatever scene anims I couldnt do in tiled)
        this.enviroAnims(!this.won); 
        
        // custom collsion check for emptyheart objects
        //     > only runs when player has a heart
        if(this.heartCount > 0){ this.emptyHeartsCollider(my.sprite.player); } 
        
        // update UI
        this.keysTxt.setText(`KEYS:${this.keyCount}`);
        this.shroombTxt.setText(`SHROOMBUSTERS:${this.shroombustCount}`);
        if(this.currCheckpoint.x > 0 && !this.won){ this.teleportTxt.setVisible(true); }

        //////////////////////////* WIN STATE *//////////////////////////
        if(this.heartsFilled > 2 && this.won == false){ this.win(); }
        if(this.won == true){ 
            // ascend UFO to offscreen
            if(this.UFOlayer.y > -540){
                this.UFOlayer.y -= this.UFOspeed/2;
                this.friend.y -= this.UFOspeed/2;
                this.playerHusk.y -= this.UFOspeed/2;
                for(let i in this.emptyHearts){ 
                    this.emptyHearts[i].y -= this.UFOspeed/2; 
                }
            } else { for(let sfx of this.sfx_ALL){ sfx.stop(); } }

            // play again controls
            if (Phaser.Input.Keyboard.JustDown(this.enter)) {
                // stop all sounds
                for(let sfx of this.sfx_ALL){ sfx.stop(); }
                this.bg_music.stop();
                // restart this scene
                this.scene.start("platformerScene");
            }
        }
        /////////////////////////////////////////////////////////////////
    } // end of update()
}