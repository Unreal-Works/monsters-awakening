import { getNumericalStat } from "shared/utils/Item";
import { Item } from "./constants";

export const Calculations = {
    costForNextUpgrade: (currentUpgrades: number): number => {
        return math.floor((2.5 * currentUpgrades * currentUpgrades) + 12);
    },
    getUpgradeCost: (item: Item, deltaUpgrades: number): number => {
        const maxUpgrades = getNumericalStat(item, "maxUpgrades");
        deltaUpgrades = (maxUpgrades - (item.upgrades ?? 0) < deltaUpgrades) ? 
        maxUpgrades - (item.upgrades ?? 0) : deltaUpgrades;
        let cost = 0;
        for (let i = (item.upgrades ?? 0); i < (item.upgrades ?? 0) + deltaUpgrades; i++) {
            cost += Calculations.costForNextUpgrade(i);
        }
        return cost;
    },
    getSellValue: (item: Item) => {
        const physical = getNumericalStat(item, "physical");
        const spell = getNumericalStat(item, "spell");
        let upgradeCost = 0;
        for (let i = 0; i < (item.upgrades ?? 0) - 1; i++) {
            upgradeCost += Calculations.costForNextUpgrade(i);
        }
        const res = (10 * (item.rarity ? item.rarity.multiplier : 0) * (physical + spell)) + (0.5 * upgradeCost);
        return res < 0 ? 0 : res;
    },
    getBaseWalkspeed: (speed: number): number => {
        return 14 + (math.log(speed+2) * 2 - 2);
    },
    getMaxHealth: (endurance: number, equipment: {[equipmentSlot: string]: Item}): number => {
        let defPow = 0;
        for (const [_i, equippedItem] of pairs(equipment)) {
            defPow += getNumericalStat(equippedItem, "defense") ?? 0;
        }
        return (0.7 * ((8 * (defPow)) + 1) * ((0.003 * (math.pow(1.2, 0.25 * endurance) + 
            (endurance * endurance * 0.25) + (endurance * 0.5))) + 1)) + 2000;
    },
    getMaxMana: (statValue: number): number => {
        return (0.002 * statValue * statValue) + (0.2 * statValue) + 15;
    },
    getBaseDamage: (scale: string, stat: number, equipment: {[equipmentSlot: string]: Item}): number => {
        scale = string.lower(scale);
        if (scale === "magical") {
            scale = "spell";
        }
        
        const weaponPower = equipment.Weapon ? getNumericalStat(equipment.Weapon, scale) : 0;
        const helmetPower = equipment.Helmet ? getNumericalStat(equipment.Helmet, scale) : 0;
        const chestPower = equipment.Chestplate ? getNumericalStat(equipment.Chestplate, scale) : 0;
        const equipmentPower = helmetPower + chestPower + weaponPower;
        
        const statPower = (0.05 * math.pow(1.2, 0.25 * stat)) + (stat * stat * 0.005) + (stat * 0.05);
        return (((20 * equipmentPower) + 1) * ((0.1 * statPower) + 1) * 0.8) + 100;
    },
    getBaseEnemyHealth(level: number): number {
        return math.pow(1.101, level + 100) + (300 * level * level) - (1400 * level) - 13000;
    },
    getBaseEnemyEXP(level: number, numberOfEnemies: number): number {
        const x = math.round(math.pow(1.1, level + 25) * 80 - 853);
        return x * (0.025 * (1 - (0.005 * numberOfEnemies)));
    },
    getBaseEnemyDamage(level: number): number {
      return (math.pow(1.5, (0.16 * level) + 2) * level * level * 5) + (70 * level) + 950;
    },
}