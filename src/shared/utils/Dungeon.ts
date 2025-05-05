import { generateRandomItem } from "shared/utils/Item";
import { ASSETS, BASE_ITEMS, DUNGEONS, DifficultyStats, Dungeon, Enemy, Loot, PotentialLoot } from "shared/utils/constants";

const random = new Random();

export const getRandomisedLoot = (loot: PotentialLoot, quantity?: number) => {
	const itemPool: {[itemID: string]: number} = {};
	let totalWeight: number = 0;

	for (const [index, relativeRarity] of pairs(loot.items)) {
		// invert the "rarity" to obtain weight and multiply by 1,000 to ensure drawability
		const inverse = (1 / relativeRarity) * 1000;
		itemPool[index] = inverse;
		totalWeight += inverse;
    }

	const chooseRandomItem = (): string => {
		const rng = (random.NextNumber() * (totalWeight - 1)) + 1;
		let counter = 0;
		for (const [item, weight] of pairs(itemPool)) {
			counter += weight;
			if (rng <= counter) {
				return item as string;
			}
		}
		error("Something wrong happened...");
    }
	
	const randomisedLoot: Loot = {gold: 0, items: [], cosmetics: [], badges: []};

    for (let i = 0; i < (loot.quantity ?? (quantity ?? 1)); i++) {
        randomisedLoot.gold += loot.gold;
        const randomItem = BASE_ITEMS[chooseRandomItem()];
        if (randomItem) {
            randomisedLoot.items.push(generateRandomItem(randomItem));
        }
    }

	return randomisedLoot;
}

export const getDifficultyStats = (dungeonStats: Dungeon, difficulty: string): DifficultyStats => {
    return dungeonStats.difficulties[difficulty];
}

export const getDungeonID = (dungeon: Dungeon): string => {
    for (const [index, value] of pairs(DUNGEONS)) {
        if (value.name === dungeon.name) {
            return index as string;
        }
    }
    error("No such dungeon with name "+dungeon.name);
}

export const getCurrentDungeon = () => {
    return getDungeonFromPlaceID(game.PlaceId);
}

export const isLobby = (dungeon?: Dungeon): boolean => {
    return dungeon ?
    (dungeon.name === DUNGEONS.LOBBY.name || dungeon.testing === true) :
    isLobby(getCurrentDungeon());
}

export const getDifficultyColor = (difficulty: string): Color3 => {
    switch (difficulty) {
        case "Easy":
            return new Color3(0, 1, 0.5);
        case "Medium":
            return new Color3(1, 1, 0);
        case "Hard":
            return new Color3(1, 0.33, 0);
        default:
            return new Color3(1, 1, 1);
    }
}

export const getRandomisedDungeonLoot = (dungeon: Dungeon, difficulty: string, quantity: number = 2, level?: number): Loot => {
    if (dungeon === DUNGEONS.LOBBY && level) {
        if (level > 61) {
            return getRandomisedDungeonLoot(DUNGEONS.MOLTEN_TEMPLE, "Hard", quantity);
        }
        else if (level > 52) {
            return getRandomisedDungeonLoot(DUNGEONS.MOLTEN_TEMPLE, "Medium", quantity);
        }
        else if (level > 43) {
            return getRandomisedDungeonLoot(DUNGEONS.FROZEN_LABORATORY, "Hard", quantity);
        }
        else if (level > 34) {
            return getRandomisedDungeonLoot(DUNGEONS.FROZEN_LABORATORY, "Medium", quantity);
        }
        else if (level > 25) {
            return getRandomisedDungeonLoot(DUNGEONS.HELLS_GATE, "Hard", quantity);
        }
        else if (level > 20) {
            return getRandomisedDungeonLoot(DUNGEONS.HELLS_GATE, "Medium", quantity);
        }
        else if (level > 15) {
            return getRandomisedDungeonLoot(DUNGEONS.HELLS_GATE, "Easy", quantity);
        }
        else if (level > 10) {
            return getRandomisedDungeonLoot(DUNGEONS.ANCIENT_JUNGLE, "Hard", quantity);
        }
        else if (level > 5) {
            return getRandomisedDungeonLoot(DUNGEONS.ANCIENT_JUNGLE, "Medium", quantity);
        }
        else if (level > 0) {
            return getRandomisedDungeonLoot(DUNGEONS.ANCIENT_JUNGLE, "Easy", quantity);
        }
    }
    else {
        return getRandomisedLoot(dungeon.difficulties[difficulty].loot, quantity);
    }
    error("Whatttt");
}

export const getDungeonFromPlaceID = (placeID: number): Dungeon => {
    for (const [_index, value] of pairs(DUNGEONS)) {
        if (value.placeID === placeID) {
            return value;
        }
    }
    error("No such dungeon with place ID " + placeID);
}

export const getEnemy = (enemyID: string) => {
    return require(ASSETS.Enemies.WaitForChild(enemyID).Clone() as ModuleScript) as Enemy;
}