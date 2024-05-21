class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
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
        this.onWater = 0;
        this.onJumpThru = false;
        this.currTile = null;
        this.wait = 0;

        this.keyCount = 0;
        this.heartCount = 0;
        this.shroombustCount = 0;

        this.UFOspeed = 2;
        this.UFOright = 1;

        this.keyUp = 1;

        this.spawnX = game.config.width/10;
        this.spawnY = 1080*4 - 100;

        this.currCheckpoint = {x: -100, y: -100};
        
        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        // create map (from tilemap)
        this.map = this.add.tilemap("map-level-1", 18, 18, 30, 90);

        // tilesets
        this.tiles_marble       = this.map.addTilesetImage("packed_marble", "marble");
        this.tiles_stone        = this.map.addTilesetImage("packed_rock", "rock");
        this.tiles_platforms    = this.map.addTilesetImage("packed_tilemap", "platforms");
        this.tiles_industry     = this.map.addTilesetImage("packed_industrial", "industry");
        this.tiles_background   = this.map.addTilesetImage("tilemap-backgrounds", "backgrounds");

        this.tileSets = [this.tiles_marble, this.tiles_stone, 
            this.tiles_platforms, this.tiles_industry, this.tiles_background];
    }

///////////////* CREATE() HELPER FCNS *//////////////////
    // CREATE BASE LAYERS //
    addLayer(layerName, tilesets){
        let newLayer = this.map.createLayer(
            layerName, 
            tilesets, 
            0, 0);
        
        newLayer.setScale(this.SCALE);

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
    // VFX/PARTICLES SYSTEMS //
    initVFX(){
        /* VFX */
        // OBJECT VFX
        my.vfx.pickup = this.add.particles(0, 0, "kenny-particles", {
            frame: ['star_08.png'],
            maxAliveParticles: 1,
            scale: {start: 0.2, end: 0.1},
            lifespan: 100,
            stopAfter: 1
        });
        my.vfx.pickup.stop();

        my.vfx.openChest = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_06.png', 'smoke_07.png', 'smoke_08.png'],
            scale: {start: 0.1, end: 0.05},
            alpha: {start: 1, end: 0.7},
            lifespan: 100,
            duration: 0.5
        });
        my.vfx.openChest.stop();

        // PLAYER VFX
        // on land
        my.vfx.run = this.add.particles(0, 0, "kenny-particles", {
            frame: ['circle_05.png'],
            scale: {start: 0.005, end: 0.05},
            alpha: {start: 1, end: 0},
            lifespan: 500
        });
        my.vfx.run.stop();

        // underwater
        my.vfx.swim = this.add.particles(0, 0, "kenny-particles", {
            frame: ['circle_01.png', 'circle_02.png', 'circle_03.png', 'circle_04.png'],
            scale: {start: 0.005, end: 0.05},
            alpha: {start: 1, end: 0},
            lifespan: 500
        });
        my.vfx.run.stop();

        // superjump
        my.vfx.superjump = this.add.particles(100, 100, "kenny-particles", {
            frame: ['spark_05.png', 'spark_06.png'],
            scale: {start: 0.1, end: 0.05},
            alpha: {start: 1, end: 0},
            speedY: -100,
            lifespan: 50,
            duration: 300
        });
        my.vfx.superjump.stop();
    }
    // BASE LAYERS COLLIDERS //
    initColliders(layer, sprite){
       switch(layer){
        ///-- BACKGROUND -------------------------------///
            case "background":
                this.bgLayer.setCollisionByProperty({
                    collides: true
                });

                this.physics.add.collider(my.sprite.player, this.bgLayer);
            break;
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
                        if(tile.properties.waterBody == true){ 
                            this.tileType = 2;
                        } else {
                            // water type = waterFall
                            if(tile.properties.waterFall == true){ 
                                this.tileType = 1; 
                            } 
                            // not on water
                            else { this.tileType = 0; }
                        }
                    }
                );
            break;
        ///-- PLATFORMS --------------------------------///
            case "platforms":
                this.platformsLayer.setCollisionByProperty({
                    collides: true, jumpThru: true, breakable: true,
                    ladder: true, emptyHeart: true
                });

                // handle different tile types
                this.physics.add.collider(
                    my.sprite.player, 
                    this.platformsLayer,
                    (sprite, tile) => {
                        // tile type = jumpThru
                        if(tile.properties.jumpThru){ 
                            tile.collideDown = false;
                            tile.collideLeft = false;
                            tile.collideRight = false;
                            tile.collideUp = true;
                            // set up for pressing down to allow player to fall thru
                            this.onJumpThru = true;
                            this.currTile = tile;
                        } else{
                            this.onJumpThru = false;
                            // tile type = ladder --> turn off collision (will add overlap later)
                            if(tile.properties.ladder){ tile.setCollision(false); }
                            // tile type = breakable --> handle shroombust 
                            if(tile.properties.breakable){
                                // if player has shroombust powerup, "break" block on collision
                                if(this.shroombustCount > 0){
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
                        if(tile.properties.ladder){ this.tileType = -2; }
                    });
            break;
       ///-- UFO ---------------------------------------///
            case "UFO":
                this.UFOlayer.setCollisionByProperty({
                    collides: true, UFO: true
                });

                // handle different tile types
                this.physics.add.collider(
                    my.sprite.player, 
                    this.UFOlayer,
                    (sprite, tile) => {
                        // tile type = ladder --> turn off collision (will add overlap later)
                        sprite.x += 2*this.UFOright;
                        if(tile.properties.ladder){ tile.setCollision(false); }                        
                    }
                );
                // add overlap for ladder tiles
                //this.physics.add.overlap(
                //    sprite, 
                //    this.UFOlayer,
                //    (sprite, tile) => {
                //        if(tile.properties.ladder){ 
                //            sprite.x += 2*this.UFOright;
                //            this.tileType = -2; 
                //        }
                //    });
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
                    my.vfx.pickup.x = obj2.x;
                    my.vfx.pickup.y = obj2.y;
                    my.vfx.pickup.start();
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
                        if(this.keyCount > 0){
                            my.vfx.openChest.x = obj2.x;
                            my.vfx.openChest.y = obj2.y;
                            my.vfx.openChest.start();
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
                        my.vfx.superjump.startFollow(
                            my.sprite.player, 
                            my.sprite.player.displayWidth - 135, 
                            my.sprite.player.displayHeight - 100, false);
                        my.vfx.superjump.start();
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
                        this.heartCount++;
                        obj2.destroy(); 
                    }); 
            break;

        ///-- EMPTY HEARTS -----------------------------///
            case "emptyHearts":
            // NOTE: CANT FIGURE THIS OUT, USING CUSTOM FCN INSTEAD OF BUILT IN >:(
                // buggy, doesnt read collision when emptyhearts are moving
                // my custome fcn does tho so wahoo (TODO: FIX IF TIME)
            //    this.physics.add.overlap(
            //        sprite, 
            //        this.emptyHearts, 
            //        (obj1, obj2) => {
            //            console.log("meep");
            //            if(this.heartCount > 0){
            //                if(obj2.isEmpty == true){
            //                    obj2.anims.play('putHeart');
            //                    this.heartCount--;
            //                    obj2.isEmpty = false;
            //                }
            //            }
            //        }); 
            break;

        ///-- CHECKPOINTS ------------------------------///
        case "checkpoints":
            this.physics.add.collider(
                sprite, 
                this.checkpoints, 
                (obj1, obj2) => {
                    if(obj2.isActive == false){
                        this.currCheckpoint.x = obj2.x;
                        this.currCheckpoint.y = obj2.y;
                        obj2.anims.play('activateCheckpoint');
                        obj2.isActive = true;
                    }
                }); 
            break;
        }
        return;
    }
    // custom collision fcn for empty heartas. phaser arcade physcos hates me 
    emptyHeartsCollider(b){ // doing custon copllision for this one bc i cant get it to work with the built in >:(
        for(let i in this.emptyHearts){ 
            if(this.emptyHearts[i].isEmpty == true){ 
                if (Math.abs(this.emptyHearts[i].x - b.x) > 
                    (this.emptyHearts[i].displayWidth/2 + b.displayWidth/2)) { continue; }
                if (Math.abs(this.emptyHearts[i].y - b.y) > 
                    (this.emptyHearts[i].displayHeight/2 + b.displayHeight/2)) { continue; }
                
                this.emptyHearts[i].anims.play('putHeart');
                this.heartCount--;
                this.emptyHearts[i].isEmpty = false;
            }
        }
    }

/////////////////////////////////////////////////////////

    create() {
        this.physics.world.drawDebug = false;

        /* LAYERS */
        this.bgLayer = this.addLayer("BG", this.tileSets);
        this.platformsLayer = this.addLayer("Ground + Platforms", this.tileSets);   
        this.waterLayer = this.addLayer("Water + Deco", this.tileSets);
        
        this.friend = this.physics.add.staticSprite( // alien in UFO
            game.config.width/2, 
            130,
            "platformer_characters", 
            "tile_0006.png")
            .setScale(this.SCALE - 0.5)
            .setGravity(0);
        this.UFOlayer = this.addLayer("UFO", this.tileSets);
        this.UFOgroup = this.add.group(this.UFOlayer);

        /* OBJECT LAYERS */
        this.keys = this.addObjectLayer("Pickups + Powerups", "key", "tilemap_sheet", 27);
            for(let i in this.keys){ this.keys[i].anims.play('keySway'); }
        this.chests = this.addObjectLayer("Pickups + Powerups", "chest", "tilemap_sheet", 28);
        this.superjump = this.addObjectLayer("Pickups + Powerups", "powerup", "tilemap_sheet", 107);
        this.shroombuster = this.addObjectLayer("Pickups + Powerups", "shroombuster", "tilemap_sheet", 67);
        this.checkpoints = this.addObjectLayer("Pickups + Powerups", "checkpoint", "tilemap_sheet", 10);
            for(let i in this.checkpoints){ this.checkpoints[i].isActive = false; }
        this.hearts = this.addObjectLayer("Pickups + Powerups", "heart", "tilemap_sheet", 44);
        this.emptyHearts = this.addObjectLayer("Pickups + Powerups", "empty", "tilemap_sheet", 46);
            for(let i in this.emptyHearts){ this.emptyHearts[i].isEmpty = true; }

        /* VFX */
        this.initVFX();

        /* PLAYER */
        // set up player avatar
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

        /* COLLISION */
        let sprite = my.sprite.player;

        this.initColliders("background", sprite);
        this.initColliders("water", sprite);
        this.initColliders("platforms", sprite);
        this.initColliders("UFO", sprite);
        
        /* OBJECTS COLLISION */    
        // first, grouping objects  
        this.keyGroup = this.add.group(this.keys);
        this.chestGroup = this.add.group(this.chests);
        this.superjumpGroup = this.add.group(this.superjump);
        this.shroombusterGroup = this.add.group(this.shroombuster);
        this.checkpointsGroup = this.add.group(this.checkpoints);
        this.heartsGroup = this.add.group(this.hearts);
        this.emptyHeartsGroup = this.add.group(this.emptyHearts);

        this.initObjectColliders("keys",sprite);
        this.initObjectColliders("chests",sprite);
        this.initObjectColliders("superjumps",sprite);
        this.initObjectColliders("shroombuster",sprite);
        this.initObjectColliders("checkpoints",sprite);
        this.initObjectColliders("hearts",sprite);
        this.initObjectColliders("emptyHearts",sprite);
        
        
        /* CAMERA */
        this.cameras.main.startFollow(my.sprite.player, true);        
        this.cameras.main.setBounds(0,0,1080,1080*4);
        this.physics.world.setBounds(0,0,1080,1080*4);

        /* CHECK POINT TELEPORT LISTENER */
        this.input.keyboard.on('keydown-SPACE', () => {
            if(this.currCheckpoint.x > 0){
                sprite.x = this.currCheckpoint.x;
                sprite.y = this.currCheckpoint.y;
            } else{ /* error msg */ }
        }, this);
    }
////////////////* UPDATE() HELPER FCNS */////////////////
    xMovement(){
        if(cursors.left.isDown) {
            my.sprite.player.body.setAccelerationX(-this.acceleration);
            
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);

            my.vfx.run.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-5, my.sprite.player.displayHeight/2-5, false);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.run.start();
            }
        } else if(cursors.right.isDown) {
            my.sprite.player.body.setAccelerationX(this.acceleration);

            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

            my.vfx.run.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-30, my.sprite.player.displayHeight/2-5, false);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.run.start();
            }
        } else {
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setDragX(this.DRAG);

            my.sprite.player.anims.play('idle');

            my.vfx.run.stop();
        }
    }

    yMovement(){
        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        switch(this.tileType){
            case 2:     // underwater
                my.vfx.run.stop();
                if(cursors.up.isDown){
                    my.sprite.player.body.setVelocityY(-this.acceleration/1.5);

                    my.vfx.swim.startFollow(my.sprite.player, my.sprite.player.displayWidth/10, my.sprite.player.displayHeight/2-5, false);
                    my.vfx.swim.start();
                } else if(cursors.down.isDown){
                    my.sprite.player.body.setVelocityY(this.acceleration/1.5);

                    my.vfx.run.startFollow(my.sprite.player, my.sprite.player.displayWidth/10, my.sprite.player.displayHeight/2-5, false);
                    my.vfx.swim.start();
                } else {
                    my.sprite.player.body.setVelocityY(this.GRAVITY / 200);
                    my.vfx.swim.stop();
                }
                break;
            case 1:     // on surface of water
                my.vfx.run.stop();
                if(cursors.up.isDown){
                    my.sprite.player.body.setVelocityY(-this.acceleration);
                    my.vfx.run.startFollow(my.sprite.player, my.sprite.player.displayWidth/10, my.sprite.player.displayHeight/2-5, false);
                    my.vfx.swim.start();
                } else if(cursors.down.isDown){
                    my.sprite.player.body.setVelocityY(this.acceleration);
                    my.vfx.run.startFollow(my.sprite.player, my.sprite.player.displayWidth/10, my.sprite.player.displayHeight/2-5, false);
                    my.vfx.swim.start();
                } else {
                    my.sprite.player.body.setAccelerationY(0);
                    my.sprite.player.body.setVelocityY(0);
                    my.vfx.swim.stop();

                }
                break;
            case 0:     // on land
                my.vfx.swim.stop();
                if( my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
                        my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);     
                }    
                break;
            case -2:    // ladder
                my.vfx.run.stop();
                my.vfx.swim.stop();
                if(cursors.up.isDown){
                    my.sprite.player.body.setVelocityY(-this.ACCELERATION/2);
                } else if(cursors.down.isDown){
                    my.sprite.player.body.setVelocityY(this.ACCELERATION/2);
                } else {
                    my.sprite.player.body.setAccelerationY(0);
                    my.sprite.player.body.setVelocityY(0);
                }
                break;
            }
        
        // JUMPTHRU PLATFORM STUFF
        this.wait--;
        if(cursors.down.isDown && this.onJumpThru == true){
            this.lastTile = this.currTile;
            this.currTile.collideUp = false;
            this.wait = 30;
        }
        if(this.lastTile && this.wait < 0){ 
            this.lastTile.collideUp = true; 
        }

    }
/////////////////////////////////////////////////////////

    update() {
        // NOTE: tileType (2, 1, 0, -1) corresponds to the material that a tile is made of
        //      > can be land, waterfall, waterbody, or ladder. 
        //      > acceleration and gravity are altered by this variable, as is y-axis movement
        this.acceleration = (
            this.ACCELERATION - 
            (this.ACCELERATION * (Math.abs(this.tileType) / 3)));
        this.physics.world.gravity.y = (
            this.GRAVITY - 
            (this.GRAVITY * (Math.abs(this.tileType) / 2)));
        
        // handles x-axis movement (left/right cursor input)
        this.xMovement();
        // handles y-axis movement (up/down cursor input) with respect to tileType
        this.yMovement(this.tileType);  

        if(this.heartCount > 0){ this.emptyHeartsCollider(my.sprite.player); }

        // UFO
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

        //console.log(Math.floor(this.keys[0].startY) + " " + Math.ceil(this.keys[0].y) + " " + this.keyUp);
    }
}