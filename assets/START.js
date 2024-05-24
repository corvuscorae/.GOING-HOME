class START extends Phaser.Scene { 
    constructor() {
        super("start");
        this.my = {sprite: {}};
        this.crawlSpeed = 2;
        this.onTime = 40;
        this.offTime = this.onTime / 2;
        this.flashCountdown = this.onTime;
    }

    preload() {
        this.load.setPath("./assets/");

        this.load.bitmapFont("pixel_font", "pixel.png", "pixel.xml");

        this.load.image("wall", "wall.png");
        this.load.image("square", "square.png");

        this.load.image("heart", "heart.png");
        
        this.load.image("wizard", "wizard.png");            // player
        this.load.image("playerPotion", "potionGreen.png"); // player bullet
        this.load.image("ratA", "ratBrown.png");            // rats
        this.load.image("ghost", "ghost.png");

        this.load.image("townieA", "townie_1_1.png");       // townies
        this.load.image("townieB", "townie_1_2.png");   
        this.load.image("townieC", "townie_2_1.png");   
        this.load.image("townieD", "townie_2_2.png");   
        this.load.image("knife", "knife.png");              // townie bullets

        this.load.audio("sfx_bg", "bg.ogg");                // audio
        this.load.audio("sfx_intro", "intro.ogg");                
        this.load.audio("sfx_enemyHit", "enemyHit.ogg");
        this.load.audio("sfx_playerHit", "playerHit.ogg");
        this.load.audio("sfx_rip", "rip.ogg");
        this.load.audio("sfx_win", "win.ogg");
    
    }

    create() { 
        let my = this.my;
        let w = game.config.width;
        let h = game.config.height;

        //this.dt = [0, 200, 0];
        //this.count = 0;
        //this.detuner = 0;
        this.bgMusic = 
            this.sound.add("sfx_intro",{
                volume: 0.7,
                rate: 1,
                detune: -2400,
                loop: true
            });
        this.bgMusic.play();

        // key object for ENTER
        this.enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        
        // title
        this.title = "RAT BASTARD THE MAGE";
        this.titleCard = this.add.bitmapText(w/2, h + 30, "pixel_font", this.title, 28).setOrigin(0.5);
        
        // open scroll
        this.scroll =   "rat bastard the mage loves rats. " +
                        "the townspeople find rat bastard the mage unsettling. " +
                        "the feeling is mutual. " +
                        "rat bastard the mage has a vision for a better world... ";
        this.openScroll = this.add.bitmapText(w/2, h + 130, "pixel_font", this.scroll, 18).setOrigin(0.5);
        this.openScroll.maxWidth = w - 30;
        
        this.wizard = this.add.sprite(w/2, h + 40, "wizard");
        this.wizard.setScale(5);
        this.potion = this.add.sprite(w/2 - 100, h + 40, "playerPotion");
        this.potion.setScale(4);
        this.rat = this.add.sprite(w/2 + 100, h + 40, "ratA");
        this.rat.setScale(3);

        this.start = "press ENTER to start";
        this.startPrompt = this.add.bitmapText(w/2, h + 30, "pixel_font", this.start, 25).setOrigin(0.5);
        
        // update HTML description
        document.getElementById('description').innerHTML = 
            "<h2> > RAT BASTARD THE MAGE</h2><br>a game about a wizard who simply loves rats";

    }

    update() {
        this.flashCountdown--;
        //this.detuner++;

        let w = game.config.width;
        let h = game.config.height;

        this.potion.rotation -= 0.1;
        this.rat.rotation += 0.1;

        if(this.titleCard.y > h / 4){ this.titleCard.y -= this.crawlSpeed; }
        else if(this.openScroll.y > h / 2.25){ this.openScroll.y -= this.crawlSpeed; }
        else if(this.wizard.y > h / 1.55)   { 
            this.wizard.y -= this.crawlSpeed; 
            this.potion.y -= this.crawlSpeed;
            this.rat.y -= this.crawlSpeed;  } 
        else if(this.startPrompt.y > h - (h / 4)){ this.startPrompt.y = h - (h / 4); }
        else{
            // funky lil text effect
            if(this.flashCountdown < 0){
                this.startPrompt.fontSize = 25;
                if(this.flashCountdown < -(this.offTime)){
                    this.startPrompt.fontSize = 28;
                    this.flashCountdown = this.onTime;
                }
            }

            // change scenes
            if (Phaser.Input.Keyboard.JustDown(this.enter)) {
                this.bgMusic.stop();
                this.scene.start("lvl_1");
            }
        }
        
        //if(this.detuner % 120 == 0){
        //    this.count++;
        //}
        //this.bgMusic.setDetune(this.dt[this.count % 3]);
    }

}
