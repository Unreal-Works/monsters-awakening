import DataStore2 from "@rbxts/datastore2";
import { KnitServer, RemoteSignal, Signal } from "@rbxts/knit";
import { Calculations } from "shared/utils/Calculations";
import { generateRandomItem, getNumericalStat, isSameItem } from "shared/utils/Item";
import { getRarityFromName } from "shared/utils/Rarity";
import { BASE_ITEMS, Inventory, Item, Rarity, SerialisedInventory, SerialisedItem } from "shared/utils/constants";
import GoldService from "./GoldService";
import LevelService from "./LevelService";
import MsgService from "../MsgService";

declare global {
	interface KnitServices {
		InventoryService: typeof InventoryService;
	}
}

const indexOf = (inventory: Inventory, item?: Item) => {
    let i = -1;
    if (item) {
        inventory.storage.forEach((storedItem, index) => {
            if (isSameItem(item, storedItem)) {
                i = index;
                return;
            }
        });
    }
    return i;
}

const InventoryService = KnitServer.CreateService({
    Name: "InventoryService",

    inventoryChanged: new Signal<(player: Player, inventory: Inventory) => void>(),
    equipmentChanged: new Signal<(player: Player, equipment: {[key: string]: Item}) => void>(),
    inventoryPerPlayer: new Map<Player, Inventory>(),    
    starterDagger: generateRandomItem(BASE_ITEMS.WoodenDagger),
    starterWand: generateRandomItem(BASE_ITEMS.SpellWand),
    starterArmor: generateRandomItem(BASE_ITEMS.PeasantRobes),
    defaultInventory: undefined as Inventory | undefined,

    Client: {
        inventoryChanged: new RemoteSignal<(inventory: Inventory) => void>(),
        equipmentChanged: new RemoteSignal<(equipment: {[key: string]: Item}) => void>(),
        targetInspected: new RemoteSignal<(name: string, targetEquipment: {[key: string]: Item}) => void>(),

        getInventory(player: Player) {
            return this.Server.getInventory(player);
        },

        equipItem(player: Player, item: Item) {
            return this.Server.equipItem(player, item);
        },

        unequipItem(player: Player, itemType: string) {
            return this.Server.unequipItem(player, itemType);
        },

        upgradeItem(player: Player, item: Item, deltaUpgrades?: number) {
            return this.Server.upgradeItem(player, item, deltaUpgrades ?? 1);
        },

        sellItems(player: Player, items: Item[]) {
            let success = true;
            for (const item of items) {
                if (!this.Server.sellItem(player, item)) {
                    success = false;
                }
			}
            return success;
        },

        requestInspect(player: Player, target: Player) {
			this.targetInspected.Fire(player, target.DisplayName, InventoryService.getInventory(target).equipment);
		}
    },

    getDataStore(player: Player) {
        return DataStore2<Inventory>("Inventory", player);
    },

    getInventory(player: Player): Inventory {
        return this.inventoryPerPlayer.get(player) ?? this.getDataStore(player).Get(this.defaultInventory as Inventory);
    },
    
    setInventory(player: Player, value: Inventory) {
        this.inventoryPerPlayer.set(player, value);
        this.getDataStore(player).Set(value);
    },

    getEquipment(player: Player) {
        return this.getInventory(player).equipment;
    },

    setEquipment(player: Player, equipment: {[key: string]: Item}) {
        const inventory = this.getInventory(player);
        inventory.equipment = equipment;
        this.setInventory(player, inventory);
        this.equipmentChanged.Fire(player, equipment);
        this.Client.equipmentChanged.Fire(player, equipment);
    },

    getEquipmentSlot(player: Player, equipmentSlot: string) {
        return this.getEquipment(player)[equipmentSlot];
    },
    
    setEquipmentSlot(player: Player, equipmentSlot: string, item?: Item) {
        const equipment = this.getEquipment(player);
        if (item) {
            equipment[equipmentSlot] = item;
        }
        else {
            delete equipment[equipmentSlot];
        }
        
        this.setEquipment(player, equipment);
    },

    indexOf(player: Player, item?: Item) {
        return indexOf(this.getInventory(player), item);
    },

    /**
     * Adds the specified item to the player's inventory storage.
     * 
     * @param player Player to give item to
     * @param item Item to add
     * @returns Whether the operation was successful
     */
    addItemToStorage(player: Player, item?: Item): boolean {
        const inventory = this.getInventory(player);
        if (item) {
            inventory.storage.push(item);
            this.setInventory(player, inventory);
            return true;
        }
        return false;
    },

    removeItemFromStorage(player: Player, item: Item) {
        const inventory = this.getInventory(player);
        const index = this.indexOf(player, item);
        if (index > -1) {
            inventory.storage.remove(index);
            this.setInventory(player, inventory);
            return true;
        }
        return false;
    },
    
    replaceItem(player: Player, oldItem: Item, newItem?: Item): boolean {
        const success = this.removeItemFromStorage(player, oldItem);
        if (success) {
            this.addItemToStorage(player, newItem);
        }
        return success;
    },
    
    equipItem(player: Player, item: Item): boolean {
        if (item.type === "Weapon" || item.type === "Helmet" || item.type === "Chestplate") {
            const index = this.indexOf(player, item);
            if (index > -1) {
                if ((item.levelReq ?? 0) > LevelService.getLevel(player)) {
                    MsgService.sendGlobalNotification("Level requirement not reached.", new Color3(1, 0.2, 0.2))
                    return false;
                }
                const equippedItem = this.getEquipmentSlot(player, item.type);
                const removedFromStorage = this.removeItemFromStorage(player, item);
                if (!removedFromStorage) {
                    return false;
                }
    
                if (equippedItem) {
                    this.addItemToStorage(player, equippedItem);
                }
    
                this.setEquipmentSlot(player, item.type, item);
                return true;
            }
        }
        return false;
    },
    
    unequipItem(player: Player, equipmentSlot: string): boolean {
        const item = this.getEquipmentSlot(player, equipmentSlot);
        if (!item) {
            return false;
        }
        this.setEquipmentSlot(player, equipmentSlot, undefined);
        this.addItemToStorage(player, item);
        return true;
    },

    upgradeItem(player: Player, item: Item, deltaUpgrades: number): Item {
        deltaUpgrades = math.floor(deltaUpgrades);
		const cost = Calculations.getUpgradeCost(item, deltaUpgrades);
		const maxUpgrades = getNumericalStat(item, "maxUpgrades");
		const gold = GoldService.getGold(player);
		if (gold >= cost) {
			const inventory = this.getInventory(player);
			const index = indexOf(inventory, item);
			if (index > -1) {
				GoldService.incrementGold(player, -cost);
				item.upgrades = (item.upgrades ?? 0) + deltaUpgrades > maxUpgrades ? maxUpgrades : (item.upgrades ?? 0) + deltaUpgrades;
				inventory.storage[index] = item;
                this.setInventory(player, inventory);
			}
		}
		return item;
	},

	sellItem(player: Player, item: Item): boolean {
		const sellValue = Calculations.getSellValue(item);
		const success = this.removeItemFromStorage(player, item);
		if (success) {
			GoldService.incrementGold(player, sellValue);
			return true;
		}
		return false;
	},
    
    getItemsOfTypeInStorage(player: Player, itemType: string): Item[] {
        return this.getInventory(player).storage.filter((item) => {
            return item.type === itemType;
        });
    },

    serialiseInventory(inventory: Inventory) {
        const equipment: {[equipmentSlot: string]: SerialisedItem} = {};
        if (inventory.equipment.Helmet) {
            equipment.Helmet = this.serialiseItem(inventory.equipment.Helmet);
        }
        if (inventory.equipment.Chestplate) {
            equipment.Chestplate = this.serialiseItem(inventory.equipment.Chestplate);
        }
        if (inventory.equipment.Weapon) {
            equipment.Weapon = this.serialiseItem(inventory.equipment.Weapon);
        }
        const storage: SerialisedItem[] = [];
        inventory.storage.forEach((item) => {
            if (item) {
                storage.push(this.serialiseItem(item));
            }
        });
        return { equipment: equipment, storage: storage };
    },
    
    deserialiseInventory(serialisedInventory: SerialisedInventory) {
        const equipment: {[equipmentSlot: string]: Item} = {};
        if (serialisedInventory.equipment.Helmet) {
            equipment.Helmet = this.deserialiseItem(serialisedInventory.equipment.Helmet);
        }
        if (serialisedInventory.equipment.Chestplate) {
            equipment.Chestplate = this.deserialiseItem(serialisedInventory.equipment.Chestplate);
        }
        if (serialisedInventory.equipment.Weapon) {
            equipment.Weapon = this.deserialiseItem(serialisedInventory.equipment.Weapon);
        }
        const storage: Item[] = [];
        serialisedInventory.storage.forEach((item) => {
            storage.push(this.deserialiseItem(item));
        })
        return {equipment: equipment, storage: storage};
    },

    serialiseItem(item: Item) {
        const serialised = {...item};
        delete serialised.name;
        delete serialised.description;
        delete serialised.type;
        serialised.rarity = (serialised.rarity?.name as unknown) as Rarity; // real
        delete serialised.levelReq;
        delete serialised.wield;
        return serialised as SerialisedItem;
    },
    
    deserialiseItem(serialisedItem: SerialisedItem) {
        const baseItem = BASE_ITEMS[serialisedItem.ID];
        const deserialised = {...serialisedItem} as Item;
        deserialised.name = baseItem ? baseItem.name : "";
        deserialised.description = baseItem?.description;
        deserialised.type = baseItem ? baseItem.type : "";
        deserialised.rarity = serialisedItem.rarity ? getRarityFromName(serialisedItem.rarity) : undefined;
        deserialised.levelReq = baseItem?.levelReq;
        deserialised.wield = baseItem?.wield;
        return deserialised;
    },

    load(player: Player) {
        const dataStore = this.getDataStore(player);
        dataStore.BeforeInitialGet<SerialisedInventory>((value) => {
            return this.deserialiseInventory(value);
        });
        dataStore.BeforeSave((value) => {
            return this.serialiseInventory(value);
        });
        dataStore.OnUpdate((value) => {
            this.inventoryChanged.Fire(player, value);
            this.Client.inventoryChanged.Fire(player, value);
        });
        this.inventoryPerPlayer.set(player, this.getDataStore(player).Get(this.defaultInventory as Inventory));
        player.SetAttribute("LoadStatus", "Loaded inventory.");
    },
    
    KnitInit() {
        this.defaultInventory = {
            equipment: {},
            storage: [this.starterDagger, this.starterWand, this.starterArmor],
        };
        DataStore2.Combine("Data", "Inventory");
    }
});


export = InventoryService;

