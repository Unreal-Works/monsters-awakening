import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import { EVENT_WINDOW, EventShopOption } from "client/constants";
import DataController from "client/controllers/DataController";
import AdaptiveTabController from "client/controllers/interface/AdapativeTabController";
import UIController from "client/controllers/interface/UIController";
import { abbreviate } from "shared/utils/vrldk/NumberAbbreviations";

declare global {
    interface KnitControllers {
        EventController: typeof EventController;
    }
}

const SnowflakesService = KnitClient.GetService("SnowflakesService");

const EventController = Knit.CreateController({
    Name: "EventController",


    refreshEventWindow() {
        EVENT_WINDOW.SnowflakeOptions.Label.SnowflakesLabel.Text = abbreviate(DataController.snowflakes);
        for (const s of EVENT_WINDOW.ShopOptions.GetChildren()) {
            const shopOption = s as EventShopOption;
            const cosmeticID = tonumber(shopOption.Name) as number;
            shopOption.BoughtLabel.Visible = DataController.cosmetics.Owned.includes(cosmeticID);
            shopOption.CostLabel.SnowflakesLabel.Text = tostring(SnowflakesService.getCost(cosmeticID));
        }
    },

    load() {

    },

    KnitInit() {
        for (const s of EVENT_WINDOW.ShopOptions.GetChildren()) {
            const shopOption = s as EventShopOption;
            shopOption.MouseButton1Click.Connect(() => {
                const cosmeticID = tonumber(shopOption.Name) as number;
                if (DataController.snowflakes < SnowflakesService.getCost(cosmeticID)) {
                    UIController.playSound("Error");
                }
                else {
                    SnowflakesService.buyCosmetic(cosmeticID);
                    UIController.playSound("ItemGet");
                }
            });
        }

        EVENT_WINDOW.SnowflakeOptions.BuySnowflakes.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            AdaptiveTabController.showAdaptiveTab("Snowflakes");
        });

        DataController.snowflakesChanged.Connect(() => {
            this.refreshEventWindow();
        });

        DataController.cosmeticsUpdated.Connect(() => {
            this.refreshEventWindow();
        });

        this.refreshEventWindow();
    }
});

export = EventController;