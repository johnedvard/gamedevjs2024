import { SpineGameObject } from "@esotericsoftware/spine-phaser";
import { Scene } from "phaser";
import { DepthGroup } from "~/enums/DepthGroup";

type PlayerOptions = {startPos: Phaser.Math.Vector2};
export class Player {
    spineObject: SpineGameObject
    startPoint: Phaser.Math.Vector2 = new Phaser.Math.Vector2(200,200);
    constructor(private scene: Scene, playerOptions: PlayerOptions) {
        this.startPoint = playerOptions.startPos;
        this.init();
    }
    init(){
        this.initSpine();
        this.scene.cameras.main.startFollow(this.spineObject, true, 0.5, 0.5);
    }
    initSpine(){
        this.spineObject = this.scene.add
        .spine(this.startPoint.x, this.startPoint.y, 'player-skel', 'player-atlas')
        .setDepth(DepthGroup.player)
    }
}