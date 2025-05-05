import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import { TweenService } from "@rbxts/services";
import { CLASS_SELECTION_WINDOW } from "client/constants";
import DataController from "client/controllers/DataController";
import UIController from "client/controllers/interface/UIController";

declare global {
    interface KnitControllers {
        ClassSelectionController: typeof ClassSelectionController;
    }
}

const ClassService = KnitClient.GetService("ClassService");

const ClassSelectionController = Knit.CreateController({
    Name: "ClassSelectionController",

    showClassSelectionWindow() {
        CLASS_SELECTION_WINDOW.GroupTransparency = 0;
        CLASS_SELECTION_WINDOW.Visible = true;
    },

    hideClassSelectionWindow() {
        TweenService.Create(CLASS_SELECTION_WINDOW, new TweenInfo(0.1), {GroupTransparency: 1}).Play();
        task.delay(0.1, () => {
            CLASS_SELECTION_WINDOW.Visible = false;
        });
    },

    checkClass() {
        if (DataController.class === "None") {
            this.showClassSelectionWindow();
        }
    },

    KnitInit() {
        CLASS_SELECTION_WINDOW.Options.Warrior.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            ClassService.setClass("Warrior");
            this.hideClassSelectionWindow();
        });
        CLASS_SELECTION_WINDOW.Options.Mage.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            ClassService.setClass("Mage");
            this.hideClassSelectionWindow();
        });

        this.checkClass();
        DataController.classChanged.Connect(() => this.checkClass());
    },
});

export = ClassSelectionController;