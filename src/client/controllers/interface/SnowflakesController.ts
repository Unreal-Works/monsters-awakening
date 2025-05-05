import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import { LOCAL_PLAYER, SNOWFLAKES_WINDOW, SnowflakesPurchaseOption } from "client/constants";
import DataController from "client/controllers/DataController";
import AdaptiveTabController from "client/controllers/interface/AdapativeTabController";
import { abbreviate } from "shared/utils/vrldk/NumberAbbreviations";
import UIController from "./UIController";
import { MarketplaceService } from "@rbxts/services";

declare global {
    interface KnitControllers {
        SnowflakesController: typeof SnowflakesController;
    }
}

const SnowflakesService = KnitClient.GetService("SnowflakesService");

const SnowflakesController = Knit.CreateController({
    Name: "SnowflakesController",


    refreshSnowflakesWindow() {
        SNOWFLAKES_WINDOW.SnowflakeOptions.Label.SnowflakesLabel.Text = abbreviate(DataController.snowflakes);
    },

    load() {

    },

    KnitInit() {
        for (const s of SNOWFLAKES_WINDOW.ShopOptions.GetChildren()) {
            if (s.IsA("TextButton")) {
                const shopOption = s as SnowflakesPurchaseOption;
                const purchaseOption = SnowflakesService.getSnowflakePurchaseOption(shopOption.Name);
                shopOption.Amount.SnowflakesLabel.Text = abbreviate(purchaseOption.snowflakes);
                shopOption.Cost.CostLabel.Text = purchaseOption.cost + "R$";
                shopOption.MouseButton1Click.Connect(() => {
                    UIController.playSound("Click");
                    MarketplaceService.PromptProductPurchase(LOCAL_PLAYER, purchaseOption.productID);
                });
            }
        }
        SNOWFLAKES_WINDOW.SnowflakeOptions.BuySnowflakes.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            AdaptiveTabController.showAdaptiveTab("Event");
        });
        DataController.snowflakesChanged.Connect(() => {
            this.refreshSnowflakesWindow();
        });

        this.refreshSnowflakesWindow();
    }
});

export = SnowflakesController;