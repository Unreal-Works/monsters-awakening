import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import { ASSETS, INVENTORY_SORT_ORDER, INVENTORY_SORT_TYPES, ITEMS_WINDOW, ItemSlot } from "client/constants";
import DataController from "client/controllers/DataController";
import AdaptiveTabController from "client/controllers/interface/AdapativeTabController";
import AnalyzerController from "client/controllers/interface/AnalyzerController";
import SlotController from "client/controllers/interface/SlotController";
import UIController from "client/controllers/interface/UIController";
import { Calculations } from "shared/utils/Calculations";
import { readable } from "shared/utils/Item";
import { COSMETICS } from "shared/utils/constants";
import { abbreviate } from "shared/utils/vrldk/NumberAbbreviations";
import { paintObjects } from "shared/utils/vrldk/UIUtils";

declare global {
    interface KnitControllers {
        ItemsTabController: typeof ItemsTabController;
    }
}

const InventoryService = KnitClient.GetService("InventoryService");
const CosmeticsService = KnitClient.GetService("CosmeticsService");
const LobbyService = KnitClient.GetService("LobbyService");

const ItemsTabController = Knit.CreateController({
    Name: "ItemsTabController",

    sortOrder: INVENTORY_SORT_ORDER.ASCENDING,
    sortType: INVENTORY_SORT_TYPES.LEVEL_REQUIREMENT,
    selectedUpgradeChoice: "Once",

    refreshItemsWindow(windowToView?: string) {
        for (const slot of ITEMS_WINDOW.AvatarView.GetChildren()) {
            if (slot.IsA("CanvasGroup")) {
                SlotController.setItemOfSlot(slot as ItemSlot, DataController.inventory.equipment[slot.Name]);
            }
        }

        const itemCount = DataController.inventory.storage.size();
        const cachedSlots = ITEMS_WINDOW.StorageView.GetChildren() as CanvasGroup[];
        for (let i = 0; i < cachedSlots.size(); i++) {
            if (!cachedSlots[i].IsA("CanvasGroup")) {
                cachedSlots.remove(i);
            }
            else if (i > itemCount - 1) {
                const slot = cachedSlots[i];
                cachedSlots.remove(i);
                slot.Destroy();
            }
        }
        this.refreshCosmeticWindow();
        for (let i = 0; i < DataController.inventory.storage.size(); i++) {
            const slot = (cachedSlots[i] ?? ASSETS.Slot.Clone()) as ItemSlot;
            slot.LayoutOrder = this.sortType.getLayoutOrder(DataController.inventory.storage[i]) * this.sortOrder;
            slot.Parent = ITEMS_WINDOW.StorageView;
            SlotController.setItemOfSlot(slot, DataController.inventory.storage[i]);
        }

        if (windowToView) {
            ITEMS_WINDOW.UpgradeWindow.Visible = false;
            ITEMS_WINDOW.SellWindow.Visible = false;
            ITEMS_WINDOW.DefaultWindow.Visible = false;
            (ITEMS_WINDOW.WaitForChild(windowToView) as Frame).Visible = true;
        }
    },

    refreshUpgradeWindow() {
        const slot = SlotController.getSelectedSlot();
        const item = slot ? SlotController.getItemFromSlot(slot as ItemSlot) : undefined;
        const maxUpgrades = item ? (readable(item).maxUpgrades ?? 0) : 0;
        const variableAmount = math.floor(maxUpgrades * 0.05);
        const ups = this.selectedUpgradeChoice === "Once" ? 1 : 
            (this.selectedUpgradeChoice === "Variable" ? variableAmount : maxUpgrades);
        ITEMS_WINDOW.UpgradeWindow.Cost.ValueLabel.Text = tostring(item ? abbreviate(Calculations.getUpgradeCost(item, ups), true) : 0);
        ITEMS_WINDOW.UpgradeWindow.UpgradeOptions.Variable.DeltaLabel.Text = variableAmount + "x";
        ITEMS_WINDOW.UpgradeWindow.Upgrade.DeltaLabel.Text = "Upgrade: " + (ups === maxUpgrades ? "MAX" : ups + "x");
    },

    refreshCosmeticWindow() {
        const isCosmeticsVisible = DataController.cosmetics.Owned.size() > 0 && SlotController.selectedSlots.size() === 0;
        ITEMS_WINDOW.DefaultWindow.CosmeticLabel.Visible = isCosmeticsVisible;
        const cosmeticsOptions = ITEMS_WINDOW.DefaultWindow.CosmeticsOptions;
        cosmeticsOptions.Visible = isCosmeticsVisible;
        for (const cosmeticOption of cosmeticsOptions.GetChildren()) {
            if (cosmeticOption.IsA("TextButton")) {
                cosmeticOption.Destroy();
            }
        }
        for (const cosmeticID of DataController.cosmetics.Owned) {
            const cosmeticOption = ASSETS.CosmeticOption.Clone();
            cosmeticOption.NameLabel.Text = COSMETICS[cosmeticID - 1];
            const isWeaponEquipped = DataController.cosmetics.Equipped.Weapon === cosmeticID;
            const isArmorEquipped = DataController.cosmetics.Equipped.Armor === cosmeticID;
            paintObjects(cosmeticOption, isWeaponEquipped || isArmorEquipped ? new Color3(0.39, 1, 0.24) : new Color3(0.67, 0.67, 1));
            cosmeticOption.MouseButton1Click.Connect(() => {
                if (isWeaponEquipped) {
                    CosmeticsService.unequipCosmetic("Weapon");
                    return;
                }
                if (isArmorEquipped) {
                    CosmeticsService.unequipCosmetic("Armor");
                    return;
                }
                CosmeticsService.equipCosmetic(cosmeticID);
            });
            cosmeticOption.Parent = cosmeticsOptions;
        }
    },
    
    KnitInit() {
        ITEMS_WINDOW.SortOptions.SortLevel.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.sortType = INVENTORY_SORT_TYPES.LEVEL_REQUIREMENT;
            SlotController.deselectAllSlots();
            this.refreshItemsWindow();
        });
        
        ITEMS_WINDOW.SortOptions.SortRarity.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.sortType = INVENTORY_SORT_TYPES.RARITY;
            SlotController.deselectAllSlots();
            this.refreshItemsWindow();
        });
        
        ITEMS_WINDOW.SortOptions.SortForm.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.sortOrder = this.sortOrder === INVENTORY_SORT_ORDER.ASCENDING 
                ? INVENTORY_SORT_ORDER.DESCENDING : INVENTORY_SORT_ORDER.ASCENDING;
            
            ITEMS_WINDOW.SortOptions.SortForm.OrderLabel.Text = 
            this.sortOrder === INVENTORY_SORT_ORDER.ASCENDING ? "Ascending" : "Descending";
            SlotController.deselectAllSlots();
            this.refreshItemsWindow();
        });
        
        ITEMS_WINDOW.DefaultWindow.InteractionOptions.Equip.MouseButton1Click.Connect(() => {
            UIController.playSound("Equip");
            const slot = SlotController.getSelectedSlot();
            if (slot) {
                const item = SlotController.getItemFromSlot(slot as ItemSlot);
                if (item) {
                    InventoryService.equipItem(item);
                }
            }
            SlotController.deselectAllSlots();
        });
        
        ITEMS_WINDOW.DefaultWindow.InteractionOptions.Unequip.MouseButton1Click.Connect(() => {
            UIController.playSound("Equip");
            const slot = SlotController.getSelectedSlot();
            if (slot) {
                const item = SlotController.getItemFromSlot(slot as ItemSlot);
                if (item) {
                    InventoryService.unequipItem(item.type ?? "");
                }
            }
            SlotController.deselectAllSlots();
        });
        
        ITEMS_WINDOW.UpgradeWindow.UpgradeOptions.Once.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.selectedUpgradeChoice = "Once";
            this.refreshUpgradeWindow();
            const slot = SlotController.getSelectedSlot();
            if (slot) {
                const item = SlotController.getItemFromSlot(slot as ItemSlot);
                if (item) {
                    AnalyzerController.analyzeItem(InventoryService.upgradeItem(item, 1));
                }
            }
        });
        
        ITEMS_WINDOW.UpgradeWindow.UpgradeOptions.Variable.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.selectedUpgradeChoice = "Variable";
            this.refreshUpgradeWindow();
            const slot = SlotController.getSelectedSlot();
            if (slot) {
                const item = SlotController.getItemFromSlot(slot as ItemSlot);
                if (item) {
                    AnalyzerController.analyzeItem(InventoryService.upgradeItem(item, math.floor(readable(item).maxUpgrades ?? 0) * 0.025));
                }
            }
        });
        
        ITEMS_WINDOW.UpgradeWindow.UpgradeOptions.Maximum.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.selectedUpgradeChoice = "Maximum";
            this.refreshUpgradeWindow();
            const slot = SlotController.getSelectedSlot();
            if (slot) {
                const item = SlotController.getItemFromSlot(slot as ItemSlot);
                if (item) {
                    AnalyzerController.analyzeItem(InventoryService.upgradeItem(item, readable(item).maxUpgrades ?? 0));
                }
            }
        });
        
        ITEMS_WINDOW.SellWindow.SellOptions.SelectedOnly.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            const items = [];
            const slots = SlotController.getSelectedSlots();
            for (const slot of slots) {
                const item = SlotController.getItemFromSlot(slot as ItemSlot);
                if (item) {
                    items.push(item);
                }
            }
            InventoryService.sellItems(items);
            SlotController.deselectAllSlots();
        });

        LobbyService.sellShown.Connect(() => {
            AdaptiveTabController.showAdaptiveTab("Items");
            this.refreshItemsWindow("SellWindow");
        });
        
        LobbyService.upgradeShown.Connect(() => {
            AdaptiveTabController.showAdaptiveTab("Items");
            this.refreshItemsWindow("UpgradeWindow");
        });

        SlotController.selectedSlotsChanged.Connect((slots) => {
            if (ITEMS_WINDOW.Visible) {
                const slot = slots[0];
                const item = slot ? SlotController.getItemFromSlot(slot as ItemSlot) : undefined;
                if (ITEMS_WINDOW.DefaultWindow.Visible) {
                    this.refreshCosmeticWindow();
                    ITEMS_WINDOW.DefaultWindow.InteractionOptions.Equip.Visible =
                        item !== undefined && (ITEMS_WINDOW.AvatarView.FindFirstChild(item.type ?? "") !== undefined)
                        && slot !== undefined && slot.Parent === ITEMS_WINDOW.StorageView;
                    ITEMS_WINDOW.DefaultWindow.InteractionOptions.Unequip.Visible = slot && slot.Parent === ITEMS_WINDOW.AvatarView;
                }
                else if (ITEMS_WINDOW.UpgradeWindow.Visible && slot) {
                    this.refreshUpgradeWindow();
                }
                else if (ITEMS_WINDOW.SellWindow.Visible) {
                    let totalSellValue = 0;
                    for (const slot of SlotController.selectedSlots) {
                        const item = SlotController.getItemFromSlot(slot as ItemSlot);
                        totalSellValue += item ? Calculations.getSellValue(item) : 0;
                    }
                    ITEMS_WINDOW.SellWindow.SellOptions.SelectedOnly.CostLabel.Text = abbreviate(totalSellValue, true);
                }
            }
        });

        DataController.inventoryChanged.Connect(() => {
            this.refreshItemsWindow();
        });

        DataController.cosmeticsUpdated.Connect(() => {
            this.refreshItemsWindow();
        });
    }
});

export = ItemsTabController;