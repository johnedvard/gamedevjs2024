import { SpineGameObject } from "@esotericsoftware/spine-phaser";
import { DepthGroup } from "~/enums/DepthGroup";
import { SceneKey } from "~/enums/SceneKey";
import { GAME_WIDTH, centerScene } from "~/utils/gameUtils";

export class HUD extends Phaser.Scene {
    spineBattery: SpineGameObject;
    constructor(){
        super(SceneKey.HUD)
    }
    initSpineBattery(){
        // TODO (johnedvard) move to own class
        this.spineBattery = this.add
        .spine(GAME_WIDTH - 30, 100, 'battery-skel', 'battery-atlas')
        .setDepth(DepthGroup.ui);
        this.spineBattery.skeleton.setSkinByName('empty');
      
    }
    create(){
        centerScene(this)
        this.initSpineBattery();
    }
    preload(){}
    update(time:number,delta:number){}
}