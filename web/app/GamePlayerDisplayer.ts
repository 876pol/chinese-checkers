import {DisplayableBase} from "./DisplayableBase";
import {Colors, Fonts, Images} from "./Constants";
import {GamePlayer, GamePlayerStatus} from "./GameMediator";

export class GamePlayerDisplayer extends DisplayableBase {
    private gamePlayerArr: GamePlayer[];

    constructor() {
        super();
        this.gamePlayerArr = [];
    }

    setGamePlayerArr(gamePlayerArr: GamePlayer[]) {
        this.gamePlayerArr = gamePlayerArr;
    }

    doDisplay() {
        for (let i = 0; i < this.gamePlayerArr.length; i++) {
            const gamePlayer: GamePlayer = this.gamePlayerArr[i];
            const xOffset: number = gamePlayer.isTurn ? 20 : 0;

            this.p5.fill(Colors.PLAYER[gamePlayer.player]);
            this.p5.stroke(Colors.PLAYER_DARK[gamePlayer.player]);
            this.p5.strokeWeight(1);
            const y: number = 613 + 33 * (i + 6 - this.gamePlayerArr.length);
            this.p5.circle(23 + xOffset, y, 28);

            this.p5.textFont(Fonts.textFont);
            this.p5.textSize(22)
            this.p5.textAlign(this.p5.LEFT, this.p5.CENTER);
            this.p5.noStroke();
            this.p5.fill(0);
            this.p5.text(gamePlayer.username, 47 + xOffset, y - 2);
            if (gamePlayer.playerStatus === GamePlayerStatus.BOT) {
                this.p5.image(Images.robotSmallImg, 13 + xOffset, y - 9);
            } else if (gamePlayer.playerStatus === GamePlayerStatus.RECONNECTING) {
                this.p5.image(Images.reconnectImage, 13 + xOffset, y - 9);
            }

            if (gamePlayer.isTurn) {
                this.p5.fill(Colors.BACK_BUTTON);
                this.p5.triangle(10, y + 13, 23, y, 10, y - 13);
            }
        }
    }
}