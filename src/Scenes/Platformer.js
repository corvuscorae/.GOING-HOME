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
        this.underWater = 0;
        this.onWater = 0;
        this.onLadder = false;
        this.onJumpThru = false;
        this.currTile = null;
        this.wait = 0;

        this.keyCount = 0;
        this.heartCount = 0;
        this.shroombustCount = 0;
        
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

    //addLayer(layerName, tilesets){
    //    let newLayer = this.map.createLayer(
    //        layerName, 
    //        tilesets, 
    //        0, 0);
    //    newLayer.setScale(this.SCALE); 
//
    //    return newLayer;
    //}

    create() {
        this.physics.world.drawDebug = false;

        

        /* LAYERS */
        // background
        this.bgLayer =// this.addLayer("BG", this.tileSets);
        this.map.createLayer(
            "BG", 
            this.tileSets, 
            0, 0);
        this.bgLayer.setScale(this.SCALE);  

        // platforms
        this.platformsLayer = this.map.createLayer(
            "Ground + Platforms", 
            [this.tiles_platforms, this.tiles_marble, this.tiles_stone, this.tiles_industry], 
            0, 0);
        this.platformsLayer.setScale(this.SCALE);       

        // water
        this.waterLayer = this.map.createLayer(
            "Water + Deco", 
            [this.tiles_platforms, this.tiles_marble, this.tiles_stone], 
            0, 0);
        this.waterLayer.setScale(this.SCALE);

        /* OBJECTS */
        // keys
        this.keys = this.map.createFromObjects("Pickups + Powerups", {
            name: "key",
            key: "tilemap_sheet",
            frame: 27
        });
        for(let i in this.keys){ // rescale + shift position
            this.keys[i].x *= this.SCALE; 
            this.keys[i].y *= this.SCALE; 
            this.keys[i].setScale(this.SCALE); 
        }

        // chests
        this.chests = this.map.createFromObjects("Pickups + Powerups", {
            name: "chest",
            key: "tilemap_sheet",
            frame: 28
        });
        for(let i in this.chests){ // rescale + shift position
            this.chests[i].x *= this.SCALE; 
            this.chests[i].y *= this.SCALE; 
            this.chests[i].setScale(this.SCALE); 
        }

        // superjump
        this.superjump = this.map.createFromObjects("Pickups + Powerups", {
            name: "powerup",
            key: "tilemap_sheet",
            frame: 107
        });
        for(let i in this.superjump){ // rescale + shift position
            this.superjump[i].x *= this.SCALE; 
            this.superjump[i].y *= this.SCALE; 
            this.superjump[i].setScale(this.SCALE); 
        }
        this.physics.world.enable(this.superjump, Phaser.Physics.Arcade.STATIC_BODY);  

        // shroombuster
        this.shroombuster = this.map.createFromObjects("Pickups + Powerups", {
            name: "shroombuster",
            key: "tilemap_sheet",
            frame: 67
        });
        for(let i in this.shroombuster){ // rescale + shift position
            this.shroombuster[i].x *= this.SCALE; 
            this.shroombuster[i].y *= this.SCALE; 
            this.shroombuster[i].setScale(this.SCALE); 
        }
        this.physics.world.enable(this.shroombuster, Phaser.Physics.Arcade.STATIC_BODY); 

        // heart
        this.hearts = this.map.createFromObjects("Pickups + Powerups", {
            name: "heart",
            key: "tilemap_sheet",
            frame: 44
        });
        for(let i in this.hearts){ // rescale + shift position
            this.hearts[i].x *= this.SCALE; 
            this.hearts[i].y *= this.SCALE; 
            this.hearts[i].setScale(this.SCALE); 

            this.hearts[i].startScale = this.hearts[i]._scaleX;
        }
        this.physics.world.enable(this.hearts, Phaser.Physics.Arcade.STATIC_BODY); 

        // empty hearts
        this.emptyHearts = this.map.createFromObjects("Pickups + Powerups", {
            name: "empty",
            key: "tilemap_sheet",
            frame: 46
        });
        for(let i in this.hearts){ // rescale + shift position
            this.emptyHearts[i].x *= this.SCALE; 
            this.emptyHearts[i].y *= this.SCALE; 
            this.emptyHearts[i].setScale(this.SCALE); 
            this.emptyHearts[i].isEmpty = true;
        }
        this.physics.world.enable(this.emptyHearts, Phaser.Physics.Arcade.STATIC_BODY); 

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
        ///////////////////////////////////////////////////

        ///////////////////////////////////////////////////
        /* PLAYER */
        // set up player avatar
        my.sprite.player = this.physics.add.sprite(
            game.config.width/2, // /10, 
            100,//1080*3 - 80,
            "platformer_characters", 
            "tile_0000.png").setScale(this.SCALE - 0.5);
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.setOffset(5,6).setSize(
            my.sprite.player.displayWidth/2.5, 
            my.sprite.player.displayHeight/2,
            false);
        ///////////////////////////////////////////////////

        /* COLLISION */
        let sprite = my.sprite.player;

        // background
        this.bgLayer.setCollisionByProperty({
            collides: true
        });

        // platforms
        this.platformsLayer.setCollisionByProperty({
            collides: true,
            jumpThru: true,
            breakable: true,
            ladder: true,
            emptyHeart: true
        });

        // water
        this.waterLayer.setCollisionByProperty({
            waterBody: true,
            waterFall: true,
            collides: true
        });

        this.physics.add.overlap(
            sprite,
            this.waterLayer,
            (sprite, tile) => {
                if(tile.properties.waterBody == true){ 
                    this.underWater = 2;
                } else {
                    if(tile.properties.waterFall == true){ 
                        this.underWater = 1; 
                    } else { this.underWater = 0; }
                }
            }
        );
        /////////////////////////////
        // https://newdocs.phaser.io/docs/3.60.0/focus/Phaser.Physics.Arcade.Factory-collider
        // TODO: add callback to chack for jumpthru platforms (and other platform types) and
        // set collisions by side accordingly
        // see code starting at line 82 here:
        // https://codepen.io/cedarcantab/pen/qBpVJpO
        /////////////////////////////
        this.physics.add.collider(
            sprite, 
            this.platformsLayer,
            (sprite, tile) => {
                if(tile.properties.jumpThru){ 
                    tile.collideDown = false;
                    tile.collideLeft = false;
                    tile.collideRight = false;
                    tile.collideUp = true;
                    
                    this.onJumpThru = true;
                    this.currTile = tile;
                } else{
                    this.onJumpThru = false;
                    if(tile.properties.ladder){ tile.setCollision(false); }
                    if(tile.properties.emptyHeart){ tile.setCollision(false); }
                    if(tile.properties.breakable){
                        if(this.shroombustCount > 0){
                            this.shroombustCount--;
                            //tile.destroy(); 
                            tile.setCollision(false);
                            tile.setVisible(false);
                            tile.properties.ladder = true;
                        }
                    }
                }

                
            }
            );
        this.physics.add.overlap(
            sprite, 
            this.platformsLayer,
            (sprite, tile) => {
                if(tile.properties.ladder){ 
                    this.underWater = -2;
                }
            }
            );

        this.physics.add.collider(my.sprite.player, this.bgLayer);
        
        /* OBJECTS COLLISION */       
        this.physics.world.enable(this.keys, Phaser.Physics.Arcade.STATIC_BODY);

        // collision detection with keys
        this.keyGroup = this.add.group(this.keys);
        this.physics.add.overlap(
            my.sprite.player, 
            this.keyGroup, 
            (obj1, obj2) => {
                my.vfx.pickup.x = obj2.x;
                my.vfx.pickup.y = obj2.y;
                my.vfx.pickup.start();
                this.keyCount++;
                obj2.destroy(); 
        });    

        
        this.physics.world.enable(this.chests, Phaser.Physics.Arcade.STATIC_BODY);  

        // collision detection with chests
        this.chestGroup = this.add.group(this.chests);
        this.physics.add.collider(
            my.sprite.player, 
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

        this.superjumpGroup = this.add.group(this.superjump);
        // Handle collision detection with superjumps
        this.physics.add.overlap(
            my.sprite.player, 
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

        this.shroombusterGroup = this.add.group(this.shroombuster);
        // Handle collision detection with superjumps
        this.physics.add.overlap(
            my.sprite.player, 
            this.shroombuster, 
            (obj1, obj2) => {
                this.shroombustCount++;
                obj2.destroy(); 
            }); 

        this.heartsGroup = this.add.group(this.hearts);
        // Handle collision detection with hearts
        this.physics.add.overlap(
            my.sprite.player, 
            this.hearts, 
            (obj1, obj2) => {
                this.heartCount++;
                obj2.destroy(); 
            }); 

        this.emptyHeartsGroup = this.add.group(this.emptyHearts);
        // Handle collision detection with empty hearts
        this.physics.add.overlap(
            my.sprite.player, 
            this.emptyHearts, 
            (obj1, obj2) => {
                if(this.heartCount > 0){
                    if(obj2.isEmpty == true){
                        obj2.anims.play('putHeart');
                        this.heartCount--;
                        obj2.isEmpty = false;
                    }
                     
                }
            }); 

        /* CAMERA */
        this.cameras.main.startFollow(my.sprite.player, true);        
        this.cameras.main.setBounds(0,0,1080,1080*3);
        this.physics.world.setBounds(0,0,1080,1080*3);

        

    }

    update() {
        //console.log(`keys: ${this.keyCount}\nshroombies: ${this.shroombustCount}`);
        //this.acceleration = this.underWater ? this.ACCELERATION/3 : this.ACCELERATION;
        //this.physics.world.gravity.y = this.underWater ? 0 : this.GRAVITY;

        this.acceleration = (
            this.ACCELERATION - 
            (this.ACCELERATION * (Math.abs(this.underWater) / 3)));
        this.physics.world.gravity.y = (
            this.GRAVITY - 
            (this.GRAVITY * (Math.abs(this.underWater) / 2)));

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
        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        switch(this.underWater){
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

        // heartbeat
        for(let i in this.hearts){
            if(this.hearts[i]._scaleX < this.hearts[i].startScale + 0.7){
                this.hearts[i]._scaleX += 0.015;
                this.hearts[i]._scaleY += 0.015;
            } else{ this.hearts[i].setScale(this.hearts[i].startScale); }
        }

    }
}