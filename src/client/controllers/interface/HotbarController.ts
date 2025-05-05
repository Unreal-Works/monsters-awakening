import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import { Players, TweenService, UserInputService } from "@rbxts/services";
import { EXPERIENCE_BAR_EXTENDING_BAR, EXPERIENCE_BAR_VALUE_LABEL, HEALTH_BAR_EXTENDING_BAR, HEALTH_BAR_VALUE_LABEL, HOTBAR, HOTBAR_SLOTS, HotbarSlot, LOCAL_PLAYER, MANA_BAR_EXTENDING_BAR, MANA_BAR_VALUE_LABEL } from "client/constants";
import DataController from "client/controllers/DataController";
import UIController from "client/controllers/interface/UIController";
import { getItemsOfTypeInStorage } from "shared/utils/Inventory";
import Skill from "shared/utils/constants";
import { abbreviate } from "shared/utils/vrldk/NumberAbbreviations";
import { getHumanoid } from "shared/utils/vrldk/PlayerUtils";
import ManaController from "../combat/ManaController";
import SkillController from "../combat/SkillController";
import SkillsTabController from "./SkillsTabController";
import SlotController from "./SlotController";
import { getSkill } from "shared/utils/Skill";

declare global {
    interface KnitControllers {
        HotbarController: typeof HotbarController;
    }
}

const SkillsService = KnitClient.GetService("SkillsService");
const MsgService = KnitClient.GetService("MsgService");

const HotbarController = Knit.CreateController({
    Name: "HotbarController",

    miniLabelTweens: [] as Tween[],

    refreshExperienceBar() {
        TweenService.Create(EXPERIENCE_BAR_EXTENDING_BAR, new TweenInfo(0.15), {
            Size: new UDim2(DataController.EXP / DataController.maxEXP, 0, 1, 0)
        }).Play();
        EXPERIENCE_BAR_VALUE_LABEL.Text = abbreviate(math.floor(DataController.EXP))+"/"+abbreviate(math.floor(DataController.maxEXP));
    },

    refreshManaBar() {
        TweenService.Create(MANA_BAR_EXTENDING_BAR, new TweenInfo(0.15), {
            Size: new UDim2(ManaController.mana / ManaController.maxMana, 0, 1, 0)
        }).Play();
        MANA_BAR_VALUE_LABEL.Text = abbreviate(math.floor(ManaController.mana))+"/"+abbreviate(math.floor(ManaController.maxMana));
    },

    refreshHealthBar() {
        const humanoid = getHumanoid(LOCAL_PLAYER);
        if (humanoid) {
            TweenService.Create(HEALTH_BAR_EXTENDING_BAR, new TweenInfo(0.15), {
                Size: new UDim2(humanoid.Health / humanoid.MaxHealth, 0, 1, 0)
            }).Play();
            HEALTH_BAR_VALUE_LABEL.Text = abbreviate(math.floor(humanoid.Health))+"/"+abbreviate(math.floor(humanoid.MaxHealth));
        }
    },

    refreshPlayerIcon() {
        if (HOTBAR.PlayerInfo.Thumbnail.Image === "") {
            const [img] = Players.GetUserThumbnailAsync(LOCAL_PLAYER.UserId, Enum.ThumbnailType.HeadShot, Enum.ThumbnailSize.Size420x420);
            HOTBAR.PlayerInfo.Thumbnail.Image = img;
        }
    },

    refreshHotbarSlots() {
        function setSkillOfSlot(slot: HotbarSlot, skill?: Skill) {
            slot.HotkeyLabel.Visible = UserInputService.KeyboardEnabled;
            slot.ColorFrame.UIStroke.Color = (skill && skill.color) ? skill.color : Color3.fromRGB(200, 200, 200);
            slot.Image = skill ? (skill?.image ?? "") : "";
        }
        setSkillOfSlot(HOTBAR_SLOTS.Slot1, DataController.skills.Equipped.b1);
        setSkillOfSlot(HOTBAR_SLOTS.Slot2, DataController.skills.Equipped.b2);
        setSkillOfSlot(HOTBAR_SLOTS.Slot3, DataController.skills.Equipped.b3);
        setSkillOfSlot(HOTBAR_SLOTS.Slot4, DataController.skills.Equipped.b4);
        setSkillOfSlot(HOTBAR_SLOTS.Slot5, getSkill("ManaPotion"));
    },

    refreshManaPotionSlot() {
        HOTBAR_SLOTS.Slot5.ImageTransparency = 
            getItemsOfTypeInStorage(DataController.inventory, "ManaPotion").size() > 0 ? 0 : 0.8;
    },

    refreshHotbarLevelLabel() {
        HOTBAR.PlayerInfo.LevelContainer.LevelLabel.Text = tostring(DataController.level);
    },

    refreshHotbarGoldLabel() {
        HOTBAR.Gold.GoldLabel.Text = tostring(abbreviate(DataController.gold));
    },

    refreshHotbar() {
        this.refreshHotbarSlots();
        this.refreshHotbarGoldLabel();
        this.refreshHotbarLevelLabel();
        this.refreshHealthBar();
        this.refreshManaBar();
        this.refreshExperienceBar();
        this.refreshPlayerIcon();
    },

    hideHotbar() {
        HOTBAR.Visible = false;
    },
    
    showHotbar() {
        HOTBAR.Visible = true;
    },
    
    createHotbarNotification(message: string) {
        for (const v of this.miniLabelTweens) {
            v.Cancel();
            v.Destroy();
        }
        
        const miniLabel = HOTBAR.MiniAnnouncementLabel;
        miniLabel.TextTransparency = 0;
        miniLabel.TextStrokeTransparency = 0;
        miniLabel.Text = message;
        miniLabel.BorderSizePixel += 1;
        const bsp = miniLabel.BorderSizePixel;
        delay(2.5, () => {
            if (miniLabel.BorderSizePixel === bsp) {
                const tween1 = TweenService.Create(miniLabel, new TweenInfo(1), {
                    TextTransparency: 1, 
                    TextStrokeTransparency: 1
                });
                this.miniLabelTweens.push(tween1);
                tween1.Play();
            }
        });
    },

    useSkill(slotNumber: number) {
        if (!DataController.inventory.equipment.Weapon) {
            this.createHotbarNotification("<font color='#AA0000'>Equip a weapon to use skills!</font>");
            UIController.playSound("Error");
            return;
        }
        const [result, mpCost] = SkillController.useSkillSlot(slotNumber);
        if (result === false) {
            if (mpCost) {
                this.createHotbarNotification("<font color='#AA0000'>You need [" + math.ceil(mpCost) + "ゟ] to use this skill!</font>");
                UIController.playSound("Error");
            }
            return;
        }
        const hotbarSlot = HOTBAR_SLOTS.FindFirstChild("Slot" + slotNumber) as HotbarSlot | undefined;
        if (hotbarSlot) {
            const skill = DataController.skills.Equipped["b" + slotNumber];
            if (skill) {
                const cooldown = skill ? (skill.cooldown ?? 0) : (slotNumber === 5 ? 16 : 0);
                hotbarSlot.CooldownAnimFrame.Visible = true;
                hotbarSlot.CooldownAnimFrame.Size = new UDim2(1,0,1,0);
                hotbarSlot.CooldownAnimFrame.TweenSize(new UDim2(1, 0, 0, 0), Enum.EasingDirection.InOut, Enum.EasingStyle.Linear, cooldown);
                hotbarSlot.CooldownLabel.Visible = true;

                task.spawn(() => {
                    const last = tick();
                    let cdleft = (cooldown - (tick() - last));
                    while (cdleft > 0) {
                        wait();
                        cdleft = (cooldown - (tick() - last));
                        hotbarSlot.CooldownLabel.Text = string.format("%." + 1 + "f", cdleft + 0.1);
                    }
                    hotbarSlot.CooldownLabel.Visible = false;
                    hotbarSlot.CooldownAnimFrame.Visible = false;
                });
                if (slotNumber < 5) {
                    this.createHotbarNotification(
                        "<font color='#AAAAAA'>" + skill.name + " skill used! [<font color='#55FFFF'>-" + (mpCost ? math.ceil(mpCost) : 0) + "ゟ</font>]</font>");
                }
            }
        }
    },

    onHotbarSlotClick(slotNumber: number) {
        if (SkillsTabController.isEquipWindowOpen) {
            const slot = SlotController.getSelectedSlot();
            if (SkillsTabController.equipSkill(slot ? SlotController.getSkillFromSlot(slot) : undefined, slotNumber)) {
                SkillsTabController.isEquipWindowOpen = false;
                SkillsTabController.hideEquipWindow();
                this.refreshHotbar();
            }
        }
        else
        {
            this.useSkill(slotNumber);
        }
    },

    KnitInit() {
        const onCharacterAdded = (character: Model) => {
            (character.WaitForChild("Humanoid") as Humanoid).HealthChanged.Connect(() => {
                this.refreshHealthBar();
            });
        }
        LOCAL_PLAYER.CharacterAdded.Connect(onCharacterAdded);
        if (LOCAL_PLAYER.Character) {
            onCharacterAdded(LOCAL_PLAYER.Character);
        }
        this.refreshPlayerIcon();

        (HOTBAR_SLOTS.WaitForChild("Slot1") as TextButton).MouseButton1Click.Connect(() => {
            this.onHotbarSlotClick(1);
        });
        
        (HOTBAR_SLOTS.WaitForChild("Slot2") as TextButton).MouseButton1Click.Connect(() => {
            this.onHotbarSlotClick(2);
        });
        
        (HOTBAR_SLOTS.WaitForChild("Slot3") as TextButton).MouseButton1Click.Connect(() => {
            this.onHotbarSlotClick(3);
        });
        
        (HOTBAR_SLOTS.WaitForChild("Slot4") as TextButton).MouseButton1Click.Connect(() => {
            this.onHotbarSlotClick(4);
        });
        
        (HOTBAR_SLOTS.WaitForChild("Slot5") as TextButton).MouseButton1Click.Connect(() => {
            this.onHotbarSlotClick(5);
        });

        DataController.levelChanged.Connect(() => {
            this.refreshHotbarLevelLabel(); 
        });

        DataController.EXPChanged.Connect(() => {
            this.refreshExperienceBar(); 
        });

        DataController.maxEXPChanged.Connect(() => {
            this.refreshExperienceBar(); 
        });

        DataController.inventoryChanged.Connect(() => {
            this.refreshManaPotionSlot();
        });

        DataController.skillsUpdated.Connect(() => {
            this.refreshHotbarSlots();
        });

        ManaController.manaUpdated.Connect(() => {
            this.refreshManaBar();
        });

        ManaController.maxManaUpdated.Connect(() => {
            this.refreshManaBar();
        });

        MsgService.hotbarNotificationSent.Connect((message) => {
            this.createHotbarNotification(message);
        });
    }
});

export = HotbarController;