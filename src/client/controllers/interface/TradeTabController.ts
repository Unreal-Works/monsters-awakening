import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import { ASSETS, ItemSlot, LOCAL_PLAYER, TRADE_REQUEST_WINDOW, TRADE_WINDOW } from "client/constants";
import DataController from "client/controllers/DataController";
import AdaptiveTabController from "client/controllers/interface/AdapativeTabController";
import SettingsController from "client/controllers/interface/SettingsController";
import SlotController from "client/controllers/interface/SlotController";
import UIController from "client/controllers/interface/UIController";
import { Item, Trade } from "shared/utils/constants";

declare global {
    interface KnitControllers {
        TradeTabController: typeof TradeTabController;
    }
}

const TradeService = KnitClient.GetService("TradeService");

const TradeTabController = Knit.CreateController({
    Name: "TradeTabController",

    lastTradeRequester: undefined as Player | undefined,

    hideTradeRequestWindow() {
        TRADE_REQUEST_WINDOW.Visible = false;
    },
    
    showTradeRequestWindow(player: Player) {
        this.lastTradeRequester = player;
        TRADE_REQUEST_WINDOW.NameLabel.Text = player.DisplayName +
            " <font color='#ffff7f'>[Lvl. " + DataController.playerLevels.get(player.Name) + "]</font>";
        TRADE_REQUEST_WINDOW.Visible = true;
    },
    
    refreshTradeWindow(trade?: Trade) {
        if (!trade) {
            AdaptiveTabController.hideAdaptiveTab();
            return;
        }
        const selfPlayerSuffix = trade.P1 === LOCAL_PLAYER ? "P1" : "P2";
        const otherPlayerSuffix = selfPlayerSuffix === "P1" ? "P2" : "P1";
        TRADE_WINDOW.PlayerNameLabel.Text = "Trading with " + trade[otherPlayerSuffix].DisplayName;
        TRADE_WINDOW.SelfAcceptanceLabel.Visible = ((trade as unknown) as { [key: string]: boolean; })["Accepted" + selfPlayerSuffix];
        TRADE_WINDOW.TraderAcceptanceLabel.Visible = ((trade as unknown) as { [key: string]: boolean; })["Accepted" + otherPlayerSuffix];
    
        for (const v of TRADE_WINDOW.TraderItems.GetChildren()) {
            if (v.IsA("Frame")) {
                v.Destroy();
            }
        }
    
        if (TRADE_WINDOW.YourItems.GetChildren().size() < 2) {
            for (const item of DataController.inventory.storage) {
                if (item.type !== "DailyReward") {
                    const slot = ASSETS.Slot.Clone() as ItemSlot;
                    slot.Parent = TRADE_WINDOW.YourItems;
                    SlotController.setItemOfSlot(slot, item);
                }
            }
        }
    
        for (const v of ((trade as unknown) as { [key: string]: Item[]; })["Offer" + otherPlayerSuffix]) {
            const slot = ASSETS.Slot.Clone() as ItemSlot;
            slot.Parent = TRADE_WINDOW.TraderItems;
            SlotController.setItemOfSlot(slot, v);
        }
    },
    
    acceptTradeRequest() {
        if (this.lastTradeRequester) {
            TradeService.acceptTradeRequest(this.lastTradeRequester);
        }
    },

    load() {

    },
    
    KnitInit() {
        TRADE_REQUEST_WINDOW.AcceptRequest.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.hideTradeRequestWindow();
            this.acceptTradeRequest();
        });
        
        TRADE_REQUEST_WINDOW.DeclineRequest.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.hideTradeRequestWindow();
        });

        TRADE_WINDOW.AcceptTrade.MouseButton1Click.Connect(() => {
            TradeService.toggleTradeAcceptance();
        });

        TradeService.tradeRequestSent.Connect((player) => {
            if (SettingsController.getSetting("HideTradeRequests")) {
                return;
            }
            this.showTradeRequestWindow(player);
        });
        
        TradeService.tradeUpdated.Connect((trade) => {
            if (trade) {
                AdaptiveTabController.showAdaptiveTab("Trade");
            }
            this.refreshTradeWindow(trade);
        });
        
        SlotController.selectedSlotsChanged.Connect((slots) => {
            if (TRADE_WINDOW.Visible) {
                const items: Item[] = SlotController.selectedSlots.map((value) => {
                    return SlotController.getItemFromSlot(value as ItemSlot) as Item;
                });
        
                TradeService.setItems(items);
            }
        
            for (const slot of slots) {
                SlotController.updateSlot(slot);
            }
        });        
    }
});

export = TradeTabController;