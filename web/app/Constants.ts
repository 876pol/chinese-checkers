import * as p5 from "p5";
import {P5Singleton} from "./App";
import {GameCoordinate} from "./Coordinate";

export enum Player {
    SPECTATOR = 0,
    RED = 1,
    BLUE = 2,
    YELLOW = 3,
    GREEN = 4,
    ORANGE = 5,
    PURPLE = 6
}

export class GameConstants {
    private constructor() {
    }

    static BOARD_SIZE: number = 17;

    static HOME: { [key in Player]: GameCoordinate[] } = {
        [Player.SPECTATOR]: null,
        [Player.RED]: [
            [4, 0], [4, 1], [4, 2], [4, 3], [5, 1], [5, 2], [5, 3], [6, 2], [6, 3], [7, 3]
        ].map(([x, y]) => GameCoordinate.fromCoordinates(x, y)),

        [Player.BLUE]: [
            [0, 4], [1, 4], [1, 5], [2, 4], [2, 5], [2, 6], [3, 4], [3, 5], [3, 6], [3, 7]
        ].map(([x, y]) => GameCoordinate.fromCoordinates(x, y)),

        [Player.YELLOW]: [
            [4, 9], [4, 10], [4, 11], [4, 12], [5, 10], [5, 11], [5, 12], [6, 11], [6, 12], [7, 12]
        ].map(([x, y]) => GameCoordinate.fromCoordinates(x, y)),

        [Player.GREEN]: [
            [9, 13], [10, 13], [10, 14], [11, 13], [11, 14], [11, 15], [12, 13], [12, 14], [12, 15], [12, 16]
        ].map(([x, y]) => GameCoordinate.fromCoordinates(x, y)),

        [Player.ORANGE]: [
            [13, 9], [13, 10], [13, 11], [13, 12], [14, 10], [14, 11], [14, 12], [15, 11], [15, 12], [16, 12]
        ].map(([x, y]) => GameCoordinate.fromCoordinates(x, y)),

        [Player.PURPLE]: [
            [9, 4], [10, 4], [10, 5], [11, 4], [11, 5], [11, 6], [12, 4], [12, 5], [12, 6], [12, 7]
        ].map(([x, y]) => GameCoordinate.fromCoordinates(x, y)),
    };


    static OPPOSITE: { [key in Player]: Player } = {
        [Player.SPECTATOR]: null,
        [Player.RED]: Player.GREEN,
        [Player.BLUE]: Player.ORANGE,
        [Player.YELLOW]: Player.PURPLE,
        [Player.GREEN]: Player.RED,
        [Player.ORANGE]: Player.BLUE,
        [Player.PURPLE]: Player.YELLOW,
    };
}

export class Colors {
    private constructor() {
    }

    static readonly PLAYER_LIGHT: { [key in Player]: string } = {
        [Player.SPECTATOR]: "#ffffff",
        [Player.RED]: "#ffbdcc",
        [Player.BLUE]: "#b9f8ff",
        [Player.YELLOW]: "#ffe7af",
        [Player.GREEN]: "#d2ffb0",
        [Player.ORANGE]: "#ffcdb9",
        [Player.PURPLE]: "#c6beee",
    };

    static readonly PLAYER: { [key in Player]: string } = {
        [Player.SPECTATOR]: "#f5f5f5",
        [Player.RED]: "#fd82a1",
        [Player.BLUE]: "#78dce8",
        [Player.YELLOW]: "#ffd866",
        [Player.GREEN]: "#a9dc76",
        [Player.ORANGE]: "#fc9867",
        [Player.PURPLE]: "#ab9df2",
    };

    static readonly PLAYER_DARK: { [key in Player]: string } = {
        [Player.SPECTATOR]: "#aaaaaa",
        [Player.RED]: "#e7708c",
        [Player.BLUE]: "#60b0b9",
        [Player.YELLOW]: "#ccac51",
        [Player.GREEN]: "#87b05e",
        [Player.ORANGE]: "#c97952",
        [Player.PURPLE]: "#887dc1",
    };

    static readonly GRAY_LIGHT: string = "#d2d2d2";
    static readonly GRAY: string = "#bbbbbb";
    static readonly GRAY_DARK: string = "#999999";
    static readonly BACKGROUND: string = "#eee7d1";
    static readonly BACKGROUND_TRANSPARENT: string = "#eee7d1d8";
    static readonly BUTTON: string = "#f5f5f5";
    static readonly BUTTON_DARK: string = "#d2d2d2";
    static readonly BUTTON_BORDER: string = "#808080";
    static readonly BACK_BUTTON: string = "#7a7a7a";
    static readonly BACK_BUTTON_DARK: string = "#606060";
    static readonly TEXT: string = "#000000";
    static readonly TEXT_LIGHT: string = "#808080";
    static readonly TEXT_ERROR: string = "#ff1414";
}

export class DisplayConstants {
    static readonly CANVAS_HEIGHT = 800;
    static readonly CANVAS_WIDTH = 800;
    static readonly CIR_DIAMETER = 30;
    static readonly CIR_H_PADDING = 12;
    static readonly CIR_V_PADDING = 7;
    static readonly BOARD_H_PADDING = 148;
    static readonly BOARD_V_PADDING = 100;
}

export class Fonts {
    public static titleFont: p5.Font;
    public static textFont: p5.Font;

    static load(): void {
        const p5Instance = P5Singleton.getInstance();
        Fonts.titleFont = p5Instance.loadFont("fonts/title-font.otf");
        Fonts.textFont = p5Instance.loadFont("fonts/text-font.otf");
    }

}

export class Images {
    public static robotSmallImg: p5.Image;
    public static robotImg: p5.Image;
    public static exitImg: p5.Image;
    public static reconnectImage: p5.Image;

    static load(): void {
        const p5Instance = P5Singleton.getInstance();
        Images.robotSmallImg = p5Instance.loadImage("img/robot-small.png");
        Images.robotImg = p5Instance.loadImage("img/robot.png");
        Images.exitImg = p5Instance.loadImage("img/exit.png");
        Images.reconnectImage = p5Instance.loadImage("img/reconnect.png");
    }
}