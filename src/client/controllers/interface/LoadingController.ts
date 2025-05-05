import { KnitClient as Knit } from "@rbxts/knit";
import { Lighting, TweenService } from "@rbxts/services";
import { HOTBAR, LOADING_WINDOW, LOCAL_PLAYER, SIDEBAR_BUTTONS, TRACKED_QUEST_WINDOW } from "client/constants";
import { getDungeonFromPlaceID, isLobby } from "shared/utils/Dungeon";

declare global {
    interface KnitControllers {
        LoadingController: typeof LoadingController;
    }
}

const LoadingController = Knit.CreateController({
    Name: "LoadingController",

    showLoadingWindow() {
        LOADING_WINDOW.GroupTransparency = 0;
        LOADING_WINDOW.Visible = true;
        HOTBAR.Visible = false;
        SIDEBAR_BUTTONS.Visible = false;
        TRACKED_QUEST_WINDOW.Visible = false;
    
        const reload = () => {
            LOADING_WINDOW.StatusLabel.Text = LOCAL_PLAYER.GetAttribute("LoadStatus") as string | undefined ?? "Waiting for server.";
        };
        LOCAL_PLAYER.GetAttributeChangedSignal("LoadStatus").Connect(reload);
        reload();
        const blur = new Instance("BlurEffect", Lighting);
        let started = false;
        const inLobby = isLobby(getDungeonFromPlaceID(game.PlaceId));
        const transitionToStart = () => {
            if (started === false) {
                started = true;
                TweenService.Create(LOADING_WINDOW, new TweenInfo(1), { BackgroundTransparency: 1 }).Play();
                TweenService.Create(LOADING_WINDOW.StatusLabel, new TweenInfo(1), { TextTransparency: 1 }).Play();
                LOADING_WINDOW.TitleLabel.Text = inLobby ? "Welcome to Monsters Awakening!" : "";
                LOADING_WINDOW.SkipButton.Visible = false;
                wait(1);
                TweenService.Create(blur, new TweenInfo(1), { Size: 0 }).Play();
                TweenService.Create(LOADING_WINDOW, new TweenInfo(1), { GroupTransparency: 1 }).Play();
                task.delay(1, () => {
                    blur.Destroy();
                    LOADING_WINDOW.Visible = false;
                });
                HOTBAR.Visible = true;
                SIDEBAR_BUTTONS.Visible = true;
                TRACKED_QUEST_WINDOW.Visible = true;
            }
        };
    
        LOADING_WINDOW.SkipButton.MouseButton1Click.Connect(() => {
            transitionToStart();
        });
    
        task.spawn(() => {
            LOADING_WINDOW.SkipButton.Visible = true;
            while (LOCAL_PLAYER.GetAttribute("Loaded") !== true) {
                wait();
            }
            transitionToStart();
        });
    
    },
    
    KnitInit() {

    }
});

export = LoadingController;