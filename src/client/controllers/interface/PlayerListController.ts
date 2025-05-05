import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import { Players, TweenService } from "@rbxts/services";
import { ASSETS, LOCAL_PLAYER, PLAYER_LIST_WINDOW, PlayerSlot } from "client/constants";
import DataController from "client/controllers/DataController";
import UIController from "client/controllers/interface/UIController";

declare global {
    interface KnitControllers {
        PlayerListController: typeof PlayerListController;
    }
}

const InventoryService = KnitClient.GetService("InventoryService");
const TradeService = KnitClient.GetService("TradeService");

const PlayerListController = Knit.CreateController({
    Name: "PlayerListController",

    selectedPlayer: undefined as Player | undefined,

    hidePlayerListButton() {
        TweenService.Create(PLAYER_LIST_WINDOW, new TweenInfo(0.2), {
            Position: new UDim2(0.5, 0, -0.05, -5),
        }).Play();
    },

    showPlayerListButton() {
        TweenService.Create(PLAYER_LIST_WINDOW, new TweenInfo(0.2), {
            Position: new UDim2(0.5, 0, 0, 0),
        }).Play();
    },

    hidePlayerListWindow() {
        PLAYER_LIST_WINDOW.ExtendingWindow.Visible = false;
        PLAYER_LIST_WINDOW.InteractionOptions.Visible = false;
    },
    
    showPlayerListWindow() {
        PLAYER_LIST_WINDOW.ExtendingWindow.Visible = true;
    },
    
    togglePlayerListWindow() {
        if (PLAYER_LIST_WINDOW.ExtendingWindow.Visible) {
            this.hidePlayerListWindow();
        }
        else {
            this.showPlayerListWindow();
        }
    },
    
    selectPlayerSlot(playerSlot?: PlayerSlot) {
        this.selectedPlayer = playerSlot ? playerSlot.Player.Value as Player | undefined : undefined;
        PLAYER_LIST_WINDOW.InteractionOptions.Visible = playerSlot !== undefined;
        PLAYER_LIST_WINDOW.InteractionOptions.TradeSelected.Visible = LOCAL_PLAYER !== this.selectedPlayer;
    },
    
    getSelectedPlayer(): Player | undefined {
        return this.selectedPlayer;
    },

    refreshPlayerListWindow() {
        for (const v of PLAYER_LIST_WINDOW.ExtendingWindow.PlayerList.GetChildren()) {
            if (v.IsA("Frame")) {
                v.Destroy();
            }
        }
    
        for (const target of Players.GetPlayers()) {
            const playerSlot = ASSETS.PlayerListWindow.PlayerSlot.Clone();
            playerSlot.Parent = PLAYER_LIST_WINDOW.ExtendingWindow.PlayerList;
            playerSlot.Player.Value = target;
            playerSlot.NameLabel.Text = target.DisplayName;
            playerSlot.LevelLabel.Text = tostring(DataController.playerLevels.get(target.Name));
        }
    },

    KnitInit() {
        const onPlayerListSlot = (slot: Instance) => {
            (slot as PlayerSlot).OpenOptions.MouseButton1Click.Connect(() => {
                UIController.playSound("Click");
                this.selectPlayerSlot(this.getSelectedPlayer() === (slot as PlayerSlot).Player.Value ? undefined : slot as PlayerSlot);
            });
        }
        
        PLAYER_LIST_WINDOW.ExtendingWindow.PlayerList.ChildAdded.Connect(onPlayerListSlot);
        for (const v of PLAYER_LIST_WINDOW.ExtendingWindow.PlayerList.GetChildren()) {
            if (v.IsA("Frame")) {
                onPlayerListSlot(v);
            }
        }
        
        PLAYER_LIST_WINDOW.TogglePlayerList.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.togglePlayerListWindow();
        });
        
        PLAYER_LIST_WINDOW.InteractionOptions.InspectSelected.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            const p = this.getSelectedPlayer();
            if (p) {
                InventoryService.requestInspect(p);
            }
        });
        
        PLAYER_LIST_WINDOW.InteractionOptions.TradeSelected.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            const player = this.getSelectedPlayer();
            if (player) {
                TradeService.sendTradeRequest(player);
            }
        });
        
        PLAYER_LIST_WINDOW.InteractionOptions.InspectSelected.MouseButton1Click.Connect(() => {
            const p = this.getSelectedPlayer()
            if (p) {
                InventoryService.requestInspect(p);
            }
        });

        DataController.playerLevelsChanged.Connect(() => {
            this.refreshPlayerListWindow();
        });
    }
});

export = PlayerListController;