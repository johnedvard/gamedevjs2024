import { SpineGameObject } from "@esotericsoftware/spine-phaser";
import { Scene } from "phaser";
import { DepthGroup } from "~/enums/DepthGroup";

export class Player {
    spineObject: SpineGameObject
    startPoint: Phaser.Math.Vector2 = new Phaser.Math.Vector2(200,200);
    constructor(private scene: Scene) {
        this.init();
    }
    init(){
        this.initSpine();
    }
    initSpine(){
        console.log('init spine')
        this.spineObject = this.scene.add
        .spine(this.startPoint.x, this.startPoint.y, 'player-skel', 'player-atlas')
        .setDepth(DepthGroup.player)
        // this.spineObject.animationState.setAnimation(0, "blink", false);
    }
}