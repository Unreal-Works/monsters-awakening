import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import Icon from "@rbxts/topbar-plus";
import { SETTINGS_WINDOW } from "client/constants";
import DataController from "client/controllers/DataController";
import UIController from "client/controllers/interface/UIController";
import { Setting } from "shared/utils/constants";
import { paintObjects } from "shared/utils/vrldk/UIUtils";
import AdaptiveTabController from "./AdapativeTabController";
import AnnouncementLabelController from "./AnnouncementLabelController";

declare global {
    interface KnitControllers {
        SettingsController: typeof SettingsController;
    }
}

const SettingsService = KnitClient.GetService("SettingsService");
const RecordService = KnitClient.GetService("RecordService");

const SettingsController = Knit.CreateController({
    Name: "SettingsController",


    refreshSettingsWindow() {
        const disabled = new Color3(1, 0.23, 0.23);
        const enabled = new Color3(0.67, 1, 0.5);
        paintObjects(SETTINGS_WINDOW.InteractionOptions.MusicVolume.Toggle,
            DataController.settings.MusicDisabled ? disabled : enabled, true);
        paintObjects(SETTINGS_WINDOW.InteractionOptions.ShowTradeRequests.Toggle,
            DataController.settings.HideTradeRequests ? disabled : enabled, true);
    },

    getSetting(setting: Setting) {
        return DataController.settings[setting];
    },

    KnitInit() {
        SETTINGS_WINDOW.InteractionOptions.MusicVolume.Toggle.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            SettingsService.setSetting("MusicDisabled", !this.getSetting("MusicDisabled"));
        });
        
        SETTINGS_WINDOW.InteractionOptions.ShowTradeRequests.Toggle.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            SettingsService.setSetting("HideTradeRequests", !this.getSetting("HideTradeRequests"));
        });

        SETTINGS_WINDOW.InteractionOptions.Codes.Enter.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            const success = RecordService.redeemCode(SETTINGS_WINDOW.InteractionOptions.Codes.Input.Text);
            AnnouncementLabelController.createAnnouncement(success ? "Redeemed!" : "Invalid code.", 
                success ? Color3.fromRGB(170, 255, 127) : Color3.fromRGB(255, 0, 0))
        });

        DataController.settingsChanged.Connect(() => {
            this.refreshSettingsWindow();
        });
        UIController.settingsIcon.selected.Connect(() => {
            AdaptiveTabController.showAdaptiveTab("Settings");
        });
        UIController.settingsIcon.deselected.Connect(() => {
            AdaptiveTabController.hideAdaptiveTab(true);
        });
    }
});

export = SettingsController;