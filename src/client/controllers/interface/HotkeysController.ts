import { KnitClient as Knit } from "@rbxts/knit";
import { UserInputService, Workspace } from "@rbxts/services";
import HotbarController from "client/controllers/interface/HotbarController";
import ToggleShiftLockController from "client/controllers/interface/ToggleShiftLockController";
import UIController from "client/controllers/interface/UIController";

declare global {
    interface KnitControllers {
        HotkeysController: typeof HotkeysController;
    }
}

const HotkeysController = Knit.CreateController({
    Name: "HotkeysController",
    
    keyPerSlot: new Map<number, string>(),

    translateHotkeys(s: string) {
        let newS = s;
        this.keyPerSlot.forEach((hotkey, slot) => {
            newS = newS.gsub("%[" + tostring(slot) + "]", "[" + hotkey + "]")[0];
        });
        return newS;
    },

    getKey(slotNumber: number) {
        return this.keyPerSlot.get(slotNumber) ?? "Q";
    },

    load() {

    },

    KnitInit() {
        this.keyPerSlot.set(1, UserInputService.TouchEnabled ? "1" : "Q");
        this.keyPerSlot.set(2, UserInputService.TouchEnabled ? "2" : "E");
        this.keyPerSlot.set(3, UserInputService.TouchEnabled ? "3" : "C");
        this.keyPerSlot.set(4, UserInputService.TouchEnabled ? "4" : "X");

        UserInputService.InputBegan.Connect((input: InputObject, gameProcessedEvent: boolean) => {
            if (gameProcessedEvent) {
                return;
            }

            if (input.UserInputType === Enum.UserInputType.Keyboard) {
                switch (input.KeyCode) {
                    case Enum.KeyCode.Q:
                        return HotbarController.onHotbarSlotClick(1);
                    case Enum.KeyCode.E:
                        return HotbarController.onHotbarSlotClick(2);
                    case Enum.KeyCode.C:
                        return HotbarController.onHotbarSlotClick(3);
                    case Enum.KeyCode.X:
                        return HotbarController.onHotbarSlotClick(4);
                    case Enum.KeyCode.F:
                        return HotbarController.onHotbarSlotClick(5);
                }
            }
            else if (input.UserInputType === Enum.UserInputType.Gamepad1) {
                switch (input.KeyCode) {
                    case Enum.KeyCode.ButtonL1:
                        return HotbarController.onHotbarSlotClick(1);
                    case Enum.KeyCode.ButtonR1:
                        return HotbarController.onHotbarSlotClick(2);
                    case Enum.KeyCode.ButtonY:
                        return HotbarController.onHotbarSlotClick(3);
                    case Enum.KeyCode.ButtonX:
                        return HotbarController.onHotbarSlotClick(4);
                    case Enum.KeyCode.ButtonR2:
                        return HotbarController.onHotbarSlotClick(6);
                    case Enum.KeyCode.ButtonL2:
                        return ToggleShiftLockController.toggleShiftLock();
                }
            }
            else if (input.UserInputType === Enum.UserInputType.MouseButton1 
                && !UIController.isCursorObstructed()
                && Workspace.CurrentCamera?.CameraType === Enum.CameraType.Custom) {
                HotbarController.onHotbarSlotClick(6);
            }
        });
    },
});

export = HotkeysController;