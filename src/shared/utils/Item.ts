import { getRandomRarity, getRarityFromName } from "shared/utils/Rarity";
import { BASE_ITEMS, BaseItem, Item, ReadableItem, SerialisedItem } from "./constants";

/**
 * Returns the numerical value of the specified stat, given that there is an
 * accompanying statP value contained in the specified item.
 * 
 * @param item Item to return stat of
 * @param stat Specific numerical stat to return. Returns -1 if stat is not found
 */
export const getNumericalStat = (item: Item, stat: string): number => {
    const numericalStatPercentage = ((item as unknown) as {[key: string]: number})[stat + "P"];
    if (numericalStatPercentage !== undefined) {
        let deltaPower = 0;
        if (stat !== "maxUpgrades") {
            for (let i = 1; i < (item.upgrades ?? 0); i++) {
                deltaPower += i > 90 ? 10 : (math.floor(i * 0.1) + 1);
            }
        }
        const baseStat = ((BASE_ITEMS[item.ID] as unknown) as {[key: string]: number})[stat];
        if (baseStat) {
            const res = baseStat * (0.8 + (numericalStatPercentage * 0.002)) * (item.rarity?.multiplier ?? 1);
            return math.ceil(res + deltaPower);
        }
    }
    return ((item as unknown) as {[key: string]: number})[stat] ?? -1;
}

export const readable = (item: Item): ReadableItem => {
    const readableItem: ReadableItem = {...item};
    readableItem.physical = getNumericalStat(item, "physical");
    readableItem.spell = getNumericalStat(item, "spell");
    readableItem.defense = getNumericalStat(item, "defense");
    readableItem.maxUpgrades = getNumericalStat(item, "maxUpgrades");
    return readableItem;
}

export const getBaseItemID = (baseItem: BaseItem): string => {
	for (const [i, v] of pairs(BASE_ITEMS)) {
		if (baseItem.name === v.name) {
			return i as string;
		}
	}
	error("How?");
}

export const generateItem = (baseItem: BaseItem): Item => {
    const item = {...baseItem} as Item;
    item.physicalP = 100;
    item.spellP = 100;
    item.defenseP = 100;
    item.upgrades = 0;
    item.maxUpgradesP = 100;
    item.rarity = getRarityFromName(baseItem.rarity);
    item.creationTime = tick();
    return item;
}

export const generateRandomItem = (baseItem: BaseItem): Item => {
    const generatedItem = generateItem(baseItem);
    generatedItem.physicalP = baseItem.physical ? math.random(0, 100) : undefined;
    generatedItem.spellP = baseItem.spell ? math.random(0, 100) : undefined;
    generatedItem.defenseP = baseItem.defense ? math.random(2, 102) - 2 : undefined;
    generatedItem.maxUpgradesP = baseItem.maxUpgrades ? (baseItem.maxUpgrades > 0 ? math.random(3, 103) - 3 : -1) : undefined;
    generatedItem.rarity = getRarityFromName(baseItem.rarity) ?? getRandomRarity();
    return generatedItem;
}

export const cloneItem = (item: Item): Item => {
    return {...item};
}

export const serialiseItem = (item: Item): SerialisedItem => {    
    return {
        ID: item.ID as string,
        physicalP: item.physicalP,
        spellP: item.spellP,
        defenseP: item.defenseP,
        upgrades: item.upgrades,
        maxUpgradesP: item.maxUpgradesP,
        sell: item.sell,
        rarity: item.rarity?.name,
        creationTime: item.creationTime,
    };
}

export const deserialiseItem = (serialisedItem: SerialisedItem): Item => {
	const baseItem = BASE_ITEMS[serialisedItem.ID];
    const item = {...serialisedItem} as Item;
    item.name = baseItem.name;
    item.description = baseItem.description;
    item.type = baseItem.type;
    item.wield = baseItem.wield;
    item.levelReq = baseItem.levelReq;
    item.rarity = getRarityFromName(serialisedItem.rarity);
    item.manaRegen = baseItem.manaRegen;
    item.tier = baseItem.tier;
    return item;
}

export const getStrongestItem = (items: Item[], factor: string): Item => {
	let strongestItem = items[0];

	for (const item of items) {
        const a = ((items as unknown) as {[key: string]: unknown})[factor] as number;
        const b = ((strongestItem as unknown) as {[key: string]: unknown})[factor] as number;
		strongestItem = (a ?? 0) > (b ?? 0) ? item : strongestItem;
	}

	return strongestItem;
}

export const getThumbnail = (item: Item): string => {
	if (item === undefined) {
		error("What the hell?");
	}
	else if (item.type === "HealthPotion") {
		return "rbxgameasset://Images/HPPotion";
	}
	else if (item.type === "ManaPotion") {
		return "rbxgameasset://Images/MPPotion";
	}
	else {
		return "rbxgameasset://Images/" + item.ID;
	}
}

export const isSameItem = (a: Item, b: Item): boolean => {
	if (a.ID === b.ID && a.rarity?.name === b.rarity?.name
		&& a.sell === b.sell 
		&& a.maxUpgradesP === b.maxUpgradesP
		&& a.upgrades === b.upgrades
		&& a.defenseP === b.defenseP
		&& a.spellP === b.spellP
		&& a.physicalP === b.physicalP
		&& a.creationTime === b.creationTime) {
		return true;
	}
	return false;
}