import { KnitClient as Knit } from "@rbxts/knit";
import { RunService, Workspace } from "@rbxts/services";
import { ANALYZE_WINDOW, MOUSE } from "client/constants";
import { Calculations } from "shared/utils/Calculations";
import { getThumbnail, readable } from "shared/utils/Item";
import { getDamageMultiplier, getManaCost, getSPCost } from "shared/utils/Skill";
import Skill, { Item } from "shared/utils/constants";
import { abbreviate } from "shared/utils/vrldk/NumberAbbreviations";
import { paintObjects } from "shared/utils/vrldk/UIUtils";

declare global {
    interface KnitControllers {
        AnalyzerController: typeof AnalyzerController;
    }
}

const AnalyzerController = Knit.CreateController({
    Name: "AnalyzerController",

    moveAnalyzerWindowToMouse() {
        const canvasSize = Workspace.CurrentCamera?.ViewportSize;
        if (canvasSize) {
            ANALYZE_WINDOW.AnchorPoint = new Vector2(canvasSize.X - MOUSE.X < 200 ? 1 : 0, canvasSize.Y - MOUSE.Y < 200 ? 1 : 0);
            ANALYZE_WINDOW.Position = UDim2.fromOffset(MOUSE.X, MOUSE.Y + 36);
        }
    },
    
    showAnalyzerWindow() {
        ANALYZE_WINDOW.Visible = true;
    },
    
    hideAnalyzerWindow() {
        ANALYZE_WINDOW.Visible = false;
    },
    
    analyzeItem(item: Item) {
        const r = readable(item);
        const sell = math.floor(Calculations.getSellValue(r));
        ANALYZE_WINDOW.Item.Visible = true;
        ANALYZE_WINDOW.Skill.Visible = false;
        ANALYZE_WINDOW.Item.DescriptionLabel.Visible = r.description !== undefined;
        ANALYZE_WINDOW.Item.PhysicalPowerLabel.Visible = r.physical !== undefined && r.physical >= 0;
        ANALYZE_WINDOW.Item.MagicalPowerLabel.Visible = r.spell !== undefined && r.spell >= 0;
        ANALYZE_WINDOW.Item.HealthLabel.Visible = r.defense !== undefined && r.defense >= 0;
        ANALYZE_WINDOW.Item.UpgradesLabel.Visible = r.maxUpgrades !== undefined && r.maxUpgrades >= 0;
        ANALYZE_WINDOW.Item.SellValueLabel.Visible = sell > 0;
        ANALYZE_WINDOW.Item.ItemThumbnail.Visible = true;
    
        ANALYZE_WINDOW.Item.NameLabel.Text = r.name ?? "";
        ANALYZE_WINDOW.Item.LevelRequirementLabel.Text = r.levelReq ? "Lv. Min: " + (r.levelReq) : "";
        ANALYZE_WINDOW.Item.DescriptionLabel.Text = r.description ? r.description : "";
        ANALYZE_WINDOW.Item.PhysicalPowerLabel.Text =
            "❖ Physical Damage: " + abbreviate(math.ceil(r.physical ?? 0), true);
        ANALYZE_WINDOW.Item.MagicalPowerLabel.Text =
            "✿ Magical Damage: " + abbreviate(math.ceil(r.spell ?? 0), true);
        ANALYZE_WINDOW.Item.HealthLabel.Text = r.defense ?
            "♥ Health: " + abbreviate(math.ceil(r.defense * 0.05), true) : "";
        ANALYZE_WINDOW.Item.UpgradesLabel.Text =
            "[" + abbreviate(math.floor(r.upgrades ?? 0)) + "/" + abbreviate(math.floor(r.maxUpgrades ?? 0)) + "] Upgrades";
        ANALYZE_WINDOW.Item.SellValueLabel.Text = abbreviate(sell) + " Sell Value";
        ANALYZE_WINDOW.Item.ItemThumbnail.Image = getThumbnail(r);
    
        paintObjects(ANALYZE_WINDOW, r.rarity ? r.rarity.color : new Color3(0.36, 0.36, 0.36));
    },
    
    analyzeSkill(skill: Skill) {
        ANALYZE_WINDOW.Item.Visible = false;
        ANALYZE_WINDOW.Skill.Visible = true;
        ANALYZE_WINDOW.Skill.NameLabel.Text = skill.name;
        ANALYZE_WINDOW.Skill.DescriptionLabel.Text = skill.description ?? "";
        ANALYZE_WINDOW.Skill.SPCostLabel.Text = getSPCost(skill) === 1 ? "1 Skill Point" : abbreviate(getSPCost(skill)) + " Skill Points";
        ANALYZE_WINDOW.Skill.CooldownLabel.Visible = skill.cooldown !== undefined;
        ANALYZE_WINDOW.Skill.ManaCostLabel.Visible = skill.scaleType !== undefined;
        ANALYZE_WINDOW.Skill.PhysicalPowerLabel.Visible = skill.scaleType !== undefined && skill.scaleType === "Physical";
        ANALYZE_WINDOW.Skill.MagicalPowerLabel.Visible = skill.scaleType !== undefined && skill.scaleType !== "Physical";
    
        const multiplier = abbreviate(math.floor(getDamageMultiplier(skill)));
        ANALYZE_WINDOW.Skill.PhysicalPowerLabel.Text = "❖ Physical Damage: " + multiplier + "x";
        ANALYZE_WINDOW.Skill.MagicalPowerLabel.Text = "✿ Magical Damage: " + multiplier + "x";
        ANALYZE_WINDOW.Skill.CooldownLabel.Text = "▲ Cooldown: " + (skill.cooldown) + "s";
        ANALYZE_WINDOW.Skill.ManaCostLabel.Text = "ゟ Mana Cost: -" + abbreviate(math.floor(getManaCost(skill)));
        paintObjects(ANALYZE_WINDOW, skill.color ?? new Color3(0.69, 0.69, 0.69));
    },
    
    KnitInit() {
        RunService.Heartbeat.Connect(() => {
            AnalyzerController.moveAnalyzerWindowToMouse();
        });
    }
});

export = AnalyzerController;