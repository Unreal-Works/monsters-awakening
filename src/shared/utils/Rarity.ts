const random = new Random(tick());
export default interface Rarity {
    name: string,
    multiplier: number,
    color: Color3,
}

export const ItemRarity: {[ID: string]: Rarity} = {
    COMMON: {name: "Common", multiplier: 1, color: Color3.fromRGB(176, 176, 176)},
    UNCOMMON: {name: "Uncommon", multiplier: 1.1, color: Color3.fromRGB(56, 223, 112)},
    RARE: {name: "Rare", multiplier: 1.2, color: Color3.fromRGB(35, 152, 255)},
    EPIC: {name: "Epic", multiplier: 1.3, color: Color3.fromRGB(181, 115, 255)},
    LEGENDARY: {name: "Legendary", multiplier: 1.4, color: Color3.fromRGB(255, 195, 14)},
    AMETHYST: {name: "Amethyst", multiplier: 1, color: Color3.fromRGB(255,112, 230)}
}

export const getRarityFromName = (name?: string): Rarity | undefined => {
    if (typeOf("name") !== "string") {
        return (name as unknown) as Rarity;
    }
    for (const [_i, v] of pairs(ItemRarity)) {
        if (v.name === name) {
            return v;
        }
    }
}

export const getRandomRarity = () => {
    const r = random.NextNumber() * 1000;
    return r > 925 ? ItemRarity.EPIC : 
    (r > 750 ? ItemRarity.RARE : 
    (r > 475 ? ItemRarity.UNCOMMON : 
        ItemRarity.COMMON));
}