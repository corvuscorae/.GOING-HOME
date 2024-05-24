// debug with extreme prejudice
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: {
                x: 0,
                y: 0
            }
        }
    },
    width: 1080,
    height: 1080,
    backgroundColor: '1c1211',
    scene: [Load, Platformer]
}

var cursors;
const SCALE = 1.5;
var my = {sprite: {}, text: {}, vfx: {}};

const game = new Phaser.Game(config);