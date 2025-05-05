import { KnitClient as Knit, KnitClient, Signal } from "@rbxts/knit";
import { ContentProvider } from "@rbxts/services";
import { ITEMS_WINDOW, ItemSlot, ItemSlotContainer, SkillSlot, SkillSlotContainer, Slot, SlotContainer, TRADE_WINDOW } from "client/constants";
import AnalyzerController from "client/controllers/interface/AnalyzerController";
import { getThumbnail } from "shared/utils/Item";
import Skill, { ITEM_ASSETS, Item } from "shared/utils/constants";
import { paintObjects } from "shared/utils/vrldk/UIUtils";

declare global {
    interface KnitControllers {
        SlotController: typeof SlotController;
    }
}

const TradeService = KnitClient.GetService("TradeService");

const SlotController = Knit.CreateController({
    Name: "SlotController",

    selectedSlots: [] as Slot[],
    selectedSlotsChanged: new Signal<(slots: Slot[]) => void>(),
    cachedSlotContainers: [] as SlotContainer[],
    thumbnailLinksLoadable: {} as {[itemID: string]: boolean},

    setItemOfSlot(slot: ItemSlot, item?: Item) {
        if (!item) {
            this.setItemOfSlot(slot, {
                ID: "",
                name: "- Empty -",
                type: "",
                levelReq: 0,
                upgrades: -1,
                creationTime: 0,
            });
            return;
        }
        task.spawn(() => {
            const imageThumbnailLink: string = getThumbnail(item);
    
            slot.ViewportThumbnail.ClearAllChildren();
            slot.Thumbnail.Image = "";
    
            const useViewport = () => {
                let physicalItem = ITEM_ASSETS.FindFirstChild(item.ID);
                if (physicalItem) {
                    physicalItem = physicalItem.Clone();
                    physicalItem.Parent = slot.ViewportThumbnail;
    
                    const viewportCamera = slot.ViewportThumbnail.FindFirstChildOfClass("Camera") ?
                        slot.ViewportThumbnail.FindFirstChildOfClass("Camera") : new Instance("Camera", slot.ViewportThumbnail);
                    if (!viewportCamera) { return; }
                    slot.ViewportThumbnail.CurrentCamera = viewportCamera;
    
                    let primary: BasePart;
                    if (item.type === "Weapon") {
                        primary = physicalItem.WaitForChild("Handle") as BasePart;
                        slot.ViewportThumbnail.Rotation = 45;
                        viewportCamera.CFrame = new CFrame(primary.Position.add(new Vector3(3, 0, 0)), primary.Position).mul(new CFrame(0, 1.5, 0));
                    }
                    else if (item.type === "Chestplate") {
                        primary = physicalItem.WaitForChild("PrimaryPart") as BasePart;
                        slot.ViewportThumbnail.Rotation = 0;
                        viewportCamera.CFrame = new CFrame(primary.Position.add(new Vector3(0, 0, 5)), primary.Position).mul(new CFrame(0, -2, 0));
                    }
                    else {
                        primary = physicalItem.WaitForChild("Handle") as BasePart;
                        slot.ViewportThumbnail.Rotation = 0;
                        viewportCamera.CFrame = new CFrame((primary.CFrame.mul(new CFrame(0, 0, -2.25))).Position, primary.Position);
                    }
                }
            };
    
            if (this.thumbnailLinksLoadable[item.ID] === true) {
                slot.Thumbnail.Image = imageThumbnailLink;
                slot.ViewportThumbnail.ClearAllChildren();
            }
            else if (this.thumbnailLinksLoadable[item.ID] === undefined) {
                ContentProvider.PreloadAsync([imageThumbnailLink], (imageThumbnailLink: string, status: Enum.AssetFetchStatus) => {
                    if (status === Enum.AssetFetchStatus.Success) {
                        this.thumbnailLinksLoadable[item.ID] = true;
                        if (!slot) {
                            return;
                        }
                        const thumbnail = slot.FindFirstChild("Thumbnail") as ImageLabel;
                        const viewportThumbnail = slot.FindFirstChild("ViewportThumbnail");
                        if (thumbnail && viewportThumbnail) {
                            thumbnail.Image = imageThumbnailLink;
                            viewportThumbnail.ClearAllChildren();
                        }
                    }
                    else {
                        this.thumbnailLinksLoadable[item.ID] = false;
                        useViewport();
                    }
                });
            }
            else {
                useViewport();
            }
        });
    
        slot.TierLabel.Text = (item.type === "HealthPotion" || item.type === "ManaPotion") ? tostring(item.tier) : "";
        paintObjects(slot.Button, this.isSelected(slot) ? new Color3(0.67, 1, 0)
            : (item.rarity?.color ?? new Color3(0.69, 0.69, 0.69)));
    
        const cachedSlotContainer = this.getSlotContainer(slot) as ItemSlotContainer;
        if (cachedSlotContainer) {
            cachedSlotContainer.MouseClickConnection.Disconnect();
            cachedSlotContainer.MouseLeaveConnection.Disconnect();
            cachedSlotContainer.MouseEnterConnection.Disconnect();
        }
    
        const mouseEnterConnection = slot.Button.MouseEnter.Connect(() => {
            if (!ITEMS_WINDOW.UpgradeWindow.Visible || !this.getSelectedSlot()) {
                AnalyzerController.analyzeItem(item);
            }
    
            AnalyzerController.showAnalyzerWindow();
        });
    
        const mouseLeaveConnection = slot.Button.MouseLeave.Connect(() => {
            if (!ITEMS_WINDOW.UpgradeWindow.Visible || !this.getSelectedSlot()) {
                AnalyzerController.hideAnalyzerWindow();
            }
        });
    
        const mouseClickConnection = slot.Button.MouseButton1Click.Connect(() => {
            if (this.isSelected(slot)) {
                this.deselectSlot(slot);
            }
            else if (slot.Parent === ITEMS_WINDOW.StorageView ||
                slot.Parent === ITEMS_WINDOW.AvatarView || slot.Parent === TRADE_WINDOW.YourItems ||
                this.isMultiSelectEnabled()) {
                this.selectSlot(slot);
                AnalyzerController.analyzeItem(item);
            }
        });
    
        this.setSlotContainer(slot, {
            Slot: slot,
            Item: item,
            MouseEnterConnection: mouseEnterConnection,
            MouseLeaveConnection: mouseLeaveConnection,
            MouseClickConnection: mouseClickConnection
        });
    },
    
    isMultiSelectEnabled(): boolean {
        return ITEMS_WINDOW.SellWindow.Visible || TRADE_WINDOW.Visible;
    },
    
    deselectSlot(slot: Slot) {
        const selected = this.selectedSlots.filter((value) => {
            return slot !== value;
        });
        this.setSelectedSlots(selected);
    },
    
    deselectAllSlots() {
        this.setSelectedSlots([]);
    },
    
    selectSlot(slot: Slot) {
        if (this.selectedSlots.includes(slot)) { return; }
    
        const selected = this.selectedSlots;
        this.setSelectedSlots(this.isMultiSelectEnabled() ? [...selected, slot] : [slot]);
    },
    
    setSelectedSlots(slots: Slot[]) {
        if (slots.size() > 1 && !this.isMultiSelectEnabled()) {
            this.setSelectedSlots([slots[0]]);
            return;
        }
    
        const temp = [...this.selectedSlots];
        this.selectedSlots = slots;
        for (const t of temp) {
            this.updateSlot(t);
        }
        this.selectedSlotsChanged.Fire(slots);
    },
    
    updateSlot(slot: Slot) {
        if (slot.FindFirstChild("ViewportThumbnail")) { // TODO find better impl please
            this.setItemOfSlot(slot as ItemSlot, this.getItemFromSlot(slot as ItemSlot));
        }
        else {
            const skill = this.getSkillFromSlot(slot);
            if (skill) {
                this.setSkillOfSlot(slot, skill);
            }
        }
    },
    
    setSlotContainer(slot: Slot, slotContainer?: ItemSlotContainer | SkillSlotContainer) {
        if (slotContainer) {
            const cachedSlotContainer = this.getSlotContainer(slot);
            if (cachedSlotContainer) {
                for (const [i, v] of pairs(slotContainer)) {
                    ((cachedSlotContainer as unknown) as { [key: string]: unknown; })[i] = v;
                }
                return;
            }
            this.cachedSlotContainers.push(slotContainer);
            slot.Destroying.Connect(() => {
                this.cachedSlotContainers =
                    this.cachedSlotContainers.filter((value) => {
                        return value !== slotContainer;
                    });
            });
        }
        else {
            for (const v of this.cachedSlotContainers) {
                this.cachedSlotContainers =
                    this.cachedSlotContainers.filter((value) => {
                        return value.Slot !== slot;
                    });
            }
        }
    },
    
    getSlotContainer(slot: Slot): SlotContainer | undefined {
        for (const v of this.cachedSlotContainers) {
            if (v.Slot === slot) {
                return v;
            }
        }
        return undefined;
    },
    
    getItemFromSlot(slot: ItemSlot): Item | undefined {
        const slotContainer = this.getSlotContainer(slot);
        return slotContainer ? (slotContainer as ItemSlotContainer).Item : undefined;
    },
    
    getSkillFromSlot(slot: SkillSlot): Skill | undefined {
        const slotContainer = this.getSlotContainer(slot);
        return slotContainer ? (slotContainer as SkillSlotContainer).Skill : undefined;
    },
    
    setSkillOfSlot(slot: SkillSlot, skill: Skill) {
        if (!skill) {
            return;
        }
        task.spawn(() => {
            slot.Thumbnail.Image = skill.image ?? "";
            paintObjects(slot.Button, this.isSelected(slot) ? new Color3(0.33, 1, 0) : 
                (skill.color ?? new Color3(0.69, 0.69, 0.69)), true);
    
            const cachedSlotContainer = this.getSlotContainer(slot) as SkillSlotContainer;
            if (cachedSlotContainer) {
                cachedSlotContainer.MouseClickConnection.Disconnect();
                cachedSlotContainer.MouseLeaveConnection.Disconnect();
                cachedSlotContainer.MouseEnterConnection.Disconnect();
            }
    
            const mouseEnterConnection = slot.Button.MouseEnter.Connect(() => {
                AnalyzerController.analyzeSkill(skill);
                AnalyzerController.showAnalyzerWindow();
            });
    
            const mouseLeaveConnection = slot.Button.MouseLeave.Connect(() => {
                AnalyzerController.hideAnalyzerWindow();
            });
    
            const mouseClickConnection = slot.Button.MouseButton1Click.Connect(() => {
                if (this.isSelected(slot)) {
                    this.deselectSlot(slot);
                }
                else {
                    this.selectSlot(slot);
                }
            });
    
            this.setSlotContainer(slot, {
                Slot: slot,
                Skill: skill,
                MouseEnterConnection: mouseEnterConnection,
                MouseLeaveConnection: mouseLeaveConnection,
                MouseClickConnection: mouseClickConnection
            });
        });
    },
    
    isSelected(slot: Slot) {
        for (const s of this.selectedSlots) {
            if (s === slot) {
                return true;
            }
        }
        return false;
    },
    
    getSelectedSlot(): Slot | undefined {
        return this.selectedSlots.size() > 0 ? this.selectedSlots[0] : undefined;
    },
    
    getSelectedSlots(): Slot[] {
        return this.selectedSlots;
    },

    KnitInit() {
        
    }
});

export = SlotController;