import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import { ADAPTIVE_TAB, ASSETS, HOTBAR, SKILLS_WINDOW, SkillSlotContainer, SkillTreeTrack, Slot } from "client/constants";
import DataController from "client/controllers/DataController";
import AnnouncementLabelController from "client/controllers/interface/AnnouncementLabelController";
import SlotController from "client/controllers/interface/SlotController";
import UIController from "client/controllers/interface/UIController";
import { getChildren, getSkill } from "shared/utils/Skill";
import Skill from "shared/utils/constants";
import { abbreviate } from "shared/utils/vrldk/NumberAbbreviations";

declare global {
    interface KnitControllers {
        SkillsTabController: typeof SkillsTabController;
    }
}

const SkillsService = KnitClient.GetService("SkillsService");

const SkillsTabController = Knit.CreateController({
    Name: "SkillsTabController",

    numberOfCreatedSkillSlots: 0,
    isEquipWindowOpen: false,

    isSkillOwned(skill: Skill) {
        for (const ownedSkill of DataController.skills.Owned) {
            if (ownedSkill.ID === skill.ID) {
                return true;
            }
        }
        return false;
    },

    learnSkill(skill?: Skill): boolean {
        if (skill === undefined) {
            AnnouncementLabelController.createAnnouncement("Please select a skill.");
            return false;
        }
        const errorMessage = SkillsService.learnSkill(skill);
        if (errorMessage) {
            AnnouncementLabelController.createAnnouncement(errorMessage);
            return false;
        }
        return true;
    },

    includesSkill(skills: Skill[], skill: Skill) {
        for (const v of skills) {
            if (v.name === skill.name) {
                return true;
            }
        }
        return false;
    },
    
    makeTracks(ownedSkills: Skill[], skill: Skill, position: number) {
        let track = SKILLS_WINDOW.TreeView.FindFirstChild(tostring(position)) as SkillTreeTrack;
        if (!track) {
            track = ASSETS.SkillsWindow.Track.Clone();
            track.Parent = SKILLS_WINDOW.TreeView;
            track.Name = tostring(position);
        }
        let slot;
        for (const v of SlotController.cachedSlotContainers) {
            const skillSlotContainer = v as SkillSlotContainer;
            if (skillSlotContainer.Skill && skillSlotContainer.Skill === skill) {
                if (v.Slot.Parent) {
                    slot = v.Slot;
                }
            }
        }
        if (!slot) {
            slot = ASSETS.SkillsWindow.Skill.Clone();
            this.numberOfCreatedSkillSlots += 1;
        }
        slot.Parent = track;
        slot.LayoutOrder = this.numberOfCreatedSkillSlots;
        SlotController.setSkillOfSlot(slot, skill);
        track.UIListLayout.Padding = new UDim(1 / track.GetChildren().size(), 0);
    
        if (this.includesSkill(ownedSkills, skill)) {
            slot.Button.BackgroundTransparency = 0;
            for (const v of getChildren(skill)) {
                let cannot = false;
                if (v.skillsNeeded) {
                    for (const b of v.skillsNeeded) {
                        if (type(b) === "table") {
                            for (const r of (b as string[])) {
                                if (this.includesSkill(ownedSkills, getSkill(r) as Skill)) {
                                    break;
                                }
                            }
                        }
                        else if (!this.includesSkill(ownedSkills, getSkill(b as string) as Skill)) {
                            cannot = true;
                        }
                    }
                }
    
                if (!cannot) {
                    const nextTrack = SKILLS_WINDOW.TreeView.FindFirstChild(tostring(position + 1));
                    if (!nextTrack || !nextTrack.FindFirstChild(v.name)) {
                        this.makeTracks(ownedSkills, v, position + 1);
                    }
    
                }
    
            }
        }
        else {
            slot.Button.BackgroundTransparency = 0.7;
        }
    },
    
    showEquipWindow(skill?: Skill) {
        if (skill) {
            if (!skill.cooldown) {
                AnnouncementLabelController.createAnnouncement("<font color='#ff0000'>This is not equippable.</font>");
                return;
            }
    
            if (!this.isSkillOwned(skill)) {
                AnnouncementLabelController.createAnnouncement("<font color='#ff0000'>Unlock this skill first.</font>");
                return;
            }
    
            ADAPTIVE_TAB.Visible = false;
            HOTBAR.Visible = true;
            HOTBAR.CancelEquip.Visible = true;
            this.isEquipWindowOpen = true;
    
            AnnouncementLabelController.createAnnouncement("<font color='#aaff7f'>Please select an available slot (1-4).</font>");
        }
        else {
            AnnouncementLabelController.createAnnouncement("<font color='#ff0000'>Please select a skill.</font>");
            return;
        }
    },
    
    hideEquipWindow() {
        ADAPTIVE_TAB.Visible = true;
        HOTBAR.CancelEquip.Visible = false;
        this.isEquipWindowOpen = false;
    },

    refreshSkillPointsLeft() {
        SKILLS_WINDOW.Options.RemainingSPLabel.Text = abbreviate(DataController.remainingSP) + " Skill Points left";
    },

    refreshSkillTree() {
        for (const v of SKILLS_WINDOW.TreeView.GetChildren()) {
            if (v.IsA("Frame")) {
                for (const d of v.GetChildren()) {
                    if (d.IsA("CanvasGroup") && !SlotController.isSelected(d as Slot)) {
                        d.Destroy();
                    }
                }
                
            }
        }
        const magicArts = getSkill("MagicArts");
        if (magicArts) {
            this.makeTracks(DataController.skills.Owned, magicArts, 1);
        }
    },

    refreshSkillsWindow() {
        this.refreshSkillPointsLeft();
        this.refreshSkillTree();        
    },

    equipSkill(skill: Skill | undefined, slotNumber: number): boolean {
        if (slotNumber === 1 || slotNumber === 2 || slotNumber === 3 || slotNumber === 4) {
            SkillsService.equipSkill(skill, slotNumber);
            AnnouncementLabelController.createAnnouncement(skill ? 
                "Set slot " + slotNumber + " to " + skill.name + "." : 
                "Unequipped skill on slot " + slotNumber + ".", Color3.fromRGB(170, 255, 127))
            return true;
        }
        return false;
    },
    
    KnitInit() {
        SKILLS_WINDOW.Options.SelectionOptions.Learn.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            const selectedSlot = SlotController.getSelectedSlot();
            this.learnSkill(selectedSlot ? SlotController.getSkillFromSlot(selectedSlot) : undefined);
        });
        
        SKILLS_WINDOW.Options.TreeOptions.Respec.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            SkillsService.respecSkills();
            SlotController.deselectAllSlots();
        });
        
        SKILLS_WINDOW.Options.SelectionOptions.Equip.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            const selectedSlot = SlotController.getSelectedSlot();
            this.showEquipWindow(selectedSlot ? SlotController.getSkillFromSlot(selectedSlot) : undefined);
        });

        HOTBAR.CancelEquip.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.hideEquipWindow();
        });

        DataController.skillsUpdated.Connect(() => {
            this.refreshSkillTree();
        });

        DataController.ownedSkillsChanged.Connect(() => {
            this.refreshSkillTree();
        });

        DataController.remainingSPChanged.Connect(() => {
            this.refreshSkillPointsLeft();
        });
    }
});

export = SkillsTabController;