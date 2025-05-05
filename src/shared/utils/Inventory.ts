import { deserialiseItem, isSameItem, serialiseItem } from "shared/utils/Item";
import { Inventory, Item, SerialisedInventory, SerialisedItem } from "./constants";

export const getEquipmentSlot = (inventory: Inventory, equipmentSlot: string) => {
    return inventory.equipment[equipmentSlot];
}

export const setEquipmentSlot = (inventory: Inventory,equipmentSlot: string, item?: Item) => {
    if (!item) {
        delete inventory.equipment[equipmentSlot];
        return;
    }
    inventory.equipment[equipmentSlot] = item;
}

export const indexOf = (inventory: Inventory, item?: Item): number => {
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

/**
 * Returns the item at the specified position in storage.
 * 
 * **WARNING** This is potentially unsafe as a single Inventory update
 * could cause all item positions to be shuffled due to the nature of data
 * handling in this game. Please use with caution.
 * 
 * @param index Specified position
 * @returns 
 */
export const fromIndex = (inventory: Inventory, index: number): Item => {
    return inventory.storage[index];
}

export const addItemToStorage = (inventory: Inventory, item?: Item): boolean => {
    if (item) {
        inventory.storage.push(item);
        return true;
    }
    return false;
}

export const removeItemFromStorage = (inventory: Inventory, item: Item): boolean => {
    const index = indexOf(inventory, item);
    if (index > -1) {
        inventory.storage.remove(index);
        return true;
    }
    return false;
}

export const replaceItem = (inventory: Inventory, oldItem: Item, newItem?: Item): boolean => {
    const success = removeItemFromStorage(inventory, oldItem);
    if (success) {
        addItemToStorage(inventory, newItem);
    }
    return success;
}

export const equipItem = (inventory: Inventory, item: Item): boolean => {
    if (item.type === "Weapon" || item.type === "Helmet" || item.type === "Chestplate") {
        const index = indexOf(inventory, item);
        if (index > -1) {
            const equippedItem = getEquipmentSlot(inventory, item.type);
            const removedFromStorage = removeItemFromStorage(inventory, item);
            if (!removedFromStorage) {
                return false;
            }

            if (equippedItem) {
                addItemToStorage(inventory, equippedItem);
            }

            setEquipmentSlot(inventory, item.type, item);
            return true;
        }
    }
    return false;
}

export const unequipItem = (inventory: Inventory, equipmentSlot: string): boolean => {
    const item = getEquipmentSlot(inventory, equipmentSlot);
    if (!item) {
        return false;
    }
    addItemToStorage(inventory, item);
    setEquipmentSlot(inventory, equipmentSlot);
    return true;
}

export const getItemsOfTypeInStorage = (inventory: Inventory, itemType: string): Item[] => {
    return inventory.storage.filter((item) => {
        return item.type === itemType;
    });
}

export const serialiseInventory = (inventory: Inventory): SerialisedInventory => {
    const equipment: {[equipmentSlot: string]: SerialisedItem} = {};
    if (inventory.equipment.Helmet) {
        equipment.Helmet = serialiseItem(inventory.equipment.Helmet);
    }
    if (inventory.equipment.Chestplate) {
        equipment.Chestplate = serialiseItem(inventory.equipment.Chestplate);
    }
    if (inventory.equipment.Weapon) {
        equipment.Weapon = serialiseItem(inventory.equipment.Weapon);
    }
    const storage: SerialisedItem[] = [];
    inventory.storage.forEach((item) => {
        if (item) {
            storage.push(serialiseItem(item));
        }
    });
	return { equipment: equipment, storage: storage };
}

export const deserialiseInventory = (serialisedInventory: SerialisedInventory): Inventory => {
	const equipment: {[equipmentSlot: string]: Item} = {};
    if (serialisedInventory.equipment.Helmet) {
        equipment.Helmet = deserialiseItem(serialisedInventory.equipment.Helmet);
    }
    if (serialisedInventory.equipment.Chestplate) {
        equipment.Chestplate = deserialiseItem(serialisedInventory.equipment.Chestplate);
    }
    if (serialisedInventory.equipment.Weapon) {
        equipment.Weapon = deserialiseItem(serialisedInventory.equipment.Weapon);
    }
    const storage: Item[] = [];
    serialisedInventory.storage.forEach((item) => {
        storage.push(deserialiseItem(item));
    })
	return {equipment: equipment, storage: storage};
}