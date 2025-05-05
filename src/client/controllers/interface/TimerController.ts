import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import { TweenService } from "@rbxts/services";
import { START_BUTTON, TIMER_WINDOW } from "client/constants";
import { isLobby } from "shared/utils/Dungeon";
import { convertToMMSS } from "shared/utils/vrldk/NumberAbbreviations";

declare global {
    interface KnitControllers {
        TimerController: typeof TimerController;
    }
}

const DungeonService = KnitClient.GetService("DungeonService");

const TimerController = Knit.CreateController({
    Name: "TimerController",

    showTimerPenalty() {
        const d = TIMER_WINDOW.Death;
        d.TextTransparency = 0;
        d.TextStrokeTransparency = 0;
        d.Position = new UDim2(0.15, 0, 1.5, 0);
        TweenService.Create(d, new TweenInfo(0.7), {Position: new UDim2(0.15, 0, 1.15, 0)}).Play();
        wait(0.7);
        TweenService.Create(d, new TweenInfo(0.5), {TextTransparency: 1, TextStrokeTransparency: 1}).Play();
        wait(0.5);
        d.Visible = false;
    },

    load() {

    },
    
    KnitInit() {
        DungeonService.dungeonStarted.Connect(() => {
            TIMER_WINDOW.Visible = true;
            START_BUTTON.Visible = false;
        });
        DungeonService.timeChanged.Connect((time) => {
            TIMER_WINDOW.TimeLabel.Text = convertToMMSS(time);
        });

        if (!isLobby()) {
            START_BUTTON.Visible = true;
        }
        START_BUTTON.MouseButton1Click.Connect(() => {
            DungeonService.startDungeon();
        });
    }
});

export = TimerController;