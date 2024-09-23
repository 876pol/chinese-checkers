import {DisplayableBase} from "./DisplayableBase";
import {Colors, Player} from "./Constants";

export class GameWinnerDisplayer extends DisplayableBase {
    private winner: Player;

    constructor() {
        super();
        this.winner = Player.SPECTATOR;
    }

    setWinner(winner: Player) {
        this.winner = winner;
    }

    doDisplay() {
        this.p5.noStroke();
        this.p5.textSize(50);
        this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5.fill(Colors.TEXT);
        const s: string = "Wins!";
        this.p5.text(s, 440, 748);

        this.p5.stroke(Colors.PLAYER_DARK[this.winner]);
        this.p5.fill(Colors.PLAYER[this.winner]);
        this.p5.strokeWeight(2);
        this.p5.circle(400 - this.p5.textWidth(s) / 2, 750, 50);
    }
}