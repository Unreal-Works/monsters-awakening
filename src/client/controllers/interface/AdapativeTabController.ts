import { KnitClient as Knit, KnitClient, Signal } from "@rbxts/knit";
import { TweenService } from "@rbxts/services";
import { ADAPTIVE_TAB, ADAPTIVE_TAB_MAIN_WINDOW, AdaptiveTabWindow, ITEMS_WINDOW, PLAYER_LIST_WINDOW, TRADE_WINDOW } from "client/constants";
import UIController from "client/controllers/interface/UIController";
import AnalyzerController from "client/controllers/interface/AnalyzerController";
import PlayerListController from "client/controllers/interface/PlayerListController";
import SlotController from "client/controllers/interface/SlotController";

declare global {
    interface KnitControllers {
        AdaptiveTabController: typeof AdaptiveTabController;
    }
}

const TradeService = KnitClient.GetService("TradeService");

const AdaptiveTabController = Knit.CreateController({
    Name: "AdaptiveTabController",

    mouseLeaveConnection: undefined as RBXScriptConnection | undefined,
    adaptiveTabShown: new Signal<() => void>(),
    adaptiveTabHidden: new Signal<() => void>(),

    getCurrentWindow(): Frame | undefined {
        for (const window of ADAPTIVE_TAB_MAIN_WINDOW.GetChildren()) {
            if (window.IsA("Frame") && window.Visible) {
                return window;
            } 
        }
        return undefined;
    },
    
    showAdaptiveTab(window: string) {
        if (TRADE_WINDOW.Visible) {
            return;
        }
        
        if (!ADAPTIVE_TAB.Visible) {
            PlayerListController.hidePlayerListWindow();
            PlayerListController.hidePlayerListButton();
            UIController.enableBlur();
            ADAPTIVE_TAB.Visible = true;
            this.adaptiveTabShown.Fire();
        }
        const currentWindow = this.getCurrentWindow();
        if (currentWindow) {
            currentWindow.Visible = false;
        }
    
        if (this.mouseLeaveConnection) {
            this.mouseLeaveConnection.Disconnect();
        }
    
        this.mouseLeaveConnection = ADAPTIVE_TAB_MAIN_WINDOW.MouseLeave.Connect(() => {
            if (!ITEMS_WINDOW.UpgradeWindow.Visible) {
                AnalyzerController.hideAnalyzerWindow();
            }
        });
        
    
        const newWindow = ADAPTIVE_TAB_MAIN_WINDOW.WaitForChild(window) as AdaptiveTabWindow;
        ADAPTIVE_TAB_MAIN_WINDOW.UIStroke.UIGradient.Color = new ColorSequence(newWindow.Color.Value, newWindow.Color2.Value);
        newWindow.Visible = true;
    },
    
    
    hideAdaptiveTab(noDeselect?: boolean) {
        PlayerListController.showPlayerListButton();
        UIController.disableBlur();
        ADAPTIVE_TAB.Visible = false;
        this.adaptiveTabHidden.Fire();
        SlotController.deselectAllSlots();
    
        if (this.mouseLeaveConnection) {
            this.mouseLeaveConnection.Disconnect();
        }
        
        UIController.moveCameraToHumanoid();
        ITEMS_WINDOW.UpgradeWindow.Visible = false;
        ITEMS_WINDOW.SellWindow.Visible = false;
        ITEMS_WINDOW.DefaultWindow.Visible = true;
        const currentWindow = this.getCurrentWindow();
        if (currentWindow) {
            currentWindow.Visible = false;
        }
        if (UIController.settingsIcon.selected && !noDeselect) {
            UIController.settingsIcon.deselect();
        }
        
        TradeService.leaveTrade();
    },
    
    toggleAdaptiveTab(window?: string) {
        if (window) {
            this.showAdaptiveTab(window);
            return;
        }
    
        if (ADAPTIVE_TAB.Visible) {
            this.hideAdaptiveTab();
        }
    },

    KnitInit() {
        ADAPTIVE_TAB.CloseButton.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.hideAdaptiveTab();
        });
        
    }
});

export = AdaptiveTabController;