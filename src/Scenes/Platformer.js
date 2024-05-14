class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 500;
        this.DRAG = 1500;    // DRAG < ACCELERATION = icy slide
        this.GRAVITY = 2000;
        this.physics.world.gravity.y = this.GRAVITY;
        this.JUMP_VELOCITY = -600;

        this.debug = true;
        this.underWater = 0;
        this.onWater = 0;
    }

    create() {
        this.cameras.main.setBounds(0,0,1080,1080*3);
        this.physics.world.setBounds(0,0,1080,1080*3);
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("map-level-1", 18, 18, 30, 90);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tiles_marble       = this.map.addTilesetImage("packed_marble", "marble");
        this.tiles_stone        = this.map.addTilesetImage("packed_rock", "rock");
        this.tiles_platforms    = this.map.addTilesetImage("packed_tilemap", "platforms");

        // Create a layer  
        this.bgLayer = this.map.createLayer(
            "BG", 
            [this.tiles_platforms], 
            0, 0);
        this.bgLayer.setScale(2.0);  

        this.platformsLayer = this.map.createLayer(
            "Ground + Platforms", 
            [this.tiles_platforms, this.tiles_marble, this.tiles_stone], 
            0, 0);
        this.platformsLayer.setScale(2.0);       

        this.waterLayer = this.map.createLayer(
            "Water + Deco", 
            this.tiles_platforms, 
            0, 0);
        this.waterLayer.setScale(2.0);

        this.pickupsLayer = this.map.createLayer(
            "Pickups", 
            this.tiles_platforms, 
            0, 0);
        this.pickupsLayer.setScale(2.0);

        // Make it collidable
        this.platformsLayer.setCollisionByProperty({
            collides: true
        });

        this.waterLayer.setCollisionByProperty({
            waterBody: true,
            collides: true
        });

        this.bgLayer.setCollisionByProperty({
            collides: true
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(
            game.config.width/8, 
            1080*3 - 80, 
            "platformer_characters", 
            "tile_0000.png").setScale(SCALE);
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.setSize(my.sprite.player.displayWidth/2.5, my.sprite.player.displayHeight/2.5);
        
        let sprite = my.sprite.player;
        this.physics.add.overlap(
            sprite,
            this.waterLayer,
            (sprite, tile) => {
                if(tile.properties.waterBody == true){ 
                    this.underWater = 2;
                }
                else if (tile.properties.waterBody == false){ 
                    this.underWater = 1; 
                } else {
                    this.underWater = 0; 
                }

                //this.water(tile.properties.waterSurface);
            }
        );

        this.physics.add.collider(my.sprite.player, this.platformsLayer);
        this.physics.add.collider(my.sprite.player, this.bgLayer);

        this.cameras.main.startFollow(my.sprite.player, true);

    }

    update() {
        //this.acceleration = this.underWater ? this.ACCELERATION/3 : this.ACCELERATION;
        //this.physics.world.gravity.y = this.underWater ? 0 : this.GRAVITY;

        //console.log(3 * this.onWater);
        this.acceleration = (
            this.ACCELERATION - 
            (this.ACCELERATION * (this.underWater/3)));
        this.physics.world.gravity.y = (
            this.GRAVITY - 
            (this.GRAVITY * (this.underWater / 2)));

        if(cursors.left.isDown) {
            my.sprite.player.body.setAccelerationX(-this.acceleration);
            
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);

        } else if(cursors.right.isDown) {
            my.sprite.player.body.setAccelerationX(this.acceleration);

            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

        } else {
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setDragX(this.DRAG);

            my.sprite.player.anims.play('idle');
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        switch(this.underWater){
            case 0:     // on land
                if( my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
                        my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);     
                }    
                break; 
            case 1:     // on surface of water
                if( my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
                        my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY / 2);     
                }
                break;
            case 2:     // underwater
                if(cursors.up.isDown){
                    my.sprite.player.body.setAccelerationY(-this.acceleration);
                } else if(cursors.down.isDown){
                    my.sprite.player.body.setAccelerationY(this.acceleration);
                } else {
                    my.sprite.player.body.setVelocityY(this.GRAVITY / 200);
                    my.sprite.player.body.setDragY(this.DRAG / 100);
                }
                break;
        }


        ////////
        //console.log(`this.underWater: ${this.underWater}\nthis.onWater: ${this.onWater}`);
}
}