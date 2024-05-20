class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet//*****************************/
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");

        // Load tilemap information
        this.load.image("marble", "packed_marble.png");                 
        this.load.image("rock", "packed_rock.png");             
        this.load.image("platforms", "packed_tilemap.png");            
        this.load.image("backgrounds", "tilemap-backgrounds.png");            
        this.load.image("industry", "packed_industrial.png");            
        this.load.tilemapTiledJSON("map-level-1", "map-level-1.tmj");   // Tilemap in JSON

        // Load the tilemap as a spritesheet
        this.load.spritesheet("tilemap_sheet", "packed_tilemap.png", {
            frameWidth: 18,
            frameHeight: 18
        });
        
        this.load.multiatlas("kenny-particles", "kenny-particles.json");
    }

    create() {
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 0,
                end: 1,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0000.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0001.png" }
            ],
        });

        // super jump powerup
        this.anims.create({
            key: 'superJump',
            defaultTextureKey: "tilemap_sheet",
            frames: [ 
                {frame: 107}, 
                {frame: 108},
                {frame: 107} ],
            frameRate: 10,
            repeat: 0
        });

        // super jump powerup
        this.anims.create({
            key: 'putHeart',
            defaultTextureKey: "tilemap_sheet",
            frames: [ 
                {frame: 46}, 
                {frame: 44} ],
            frameRate: 15,
            repeat: 0
        });


         // ...and pass to the next Scene
         
         this.scene.start("platformerScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}