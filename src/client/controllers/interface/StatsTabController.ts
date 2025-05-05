import { KnitClient as Knit, KnitClient } from "@rbxts/knit";
import { STATS_WINDOW, StatUpgradeOption } from "client/constants";
import DataController from "client/controllers/DataController";
import UIController from "client/controllers/interface/UIController";
import { STAT_INFO, Stat } from "shared/utils/constants";
import { abbreviate } from "shared/utils/vrldk/NumberAbbreviations";

declare global {
    interface KnitControllers {
        StatsTabController: typeof StatsTabController;
    }
}

const StatsService = KnitClient.GetService("StatsService");

const StatsTabController = Knit.CreateController({
    Name: "StatsTabController",

    selectedStat: undefined as Stat | undefined,

    refreshStatValues() {
        for (const upgradeOption of STATS_WINDOW.UpgradeOptions.GetChildren()) {
            if (upgradeOption.IsA("TextButton")) {
                (upgradeOption as StatUpgradeOption).ValueLabel.Text = abbreviate(DataController.stats[upgradeOption.Name as Stat] ?? 0);
            }
        }

    },

    refreshLP() {
        const remainingLPLabel = abbreviate(DataController.remainingLP);
        STATS_WINDOW.UpgradeOptions.LevelPoints.ValueLabel.Text = remainingLPLabel;
        STATS_WINDOW.Information.LevelPointInformation.RemainingLevelPoints.Text = remainingLPLabel + " Remaining Level Points";
        STATS_WINDOW.Information.LevelPointInformation.TotalLevelPoints.Text = abbreviate(DataController.totalLP) + " Total Level Points";
    },

    refreshStatsWindow() {
        this.refreshStatValues();
        this.refreshLP();
        if (this.selectedStat) {
            this.showStatInformation(this.selectedStat);
        }
        else {
            this.showLevelPointInformation();
        }
    },

    selectStat(stat: Stat | undefined) {
        this.selectedStat = stat;
        this.refreshStatsWindow();
    },

    showLevelPointInformation() {
        STATS_WINDOW.Information.NameLabel.Text = "Your Stats";
        STATS_WINDOW.Information.StatInformation.Visible = false;
        STATS_WINDOW.Information.LevelPointInformation.Visible = true;
    },

    showStatInformation(stat: Stat) {
        STATS_WINDOW.Information.NameLabel.Text = STAT_INFO[stat].name;
        STATS_WINDOW.Information.StatInformation.DescriptionLabel.Text = STAT_INFO[stat].description;
        STATS_WINDOW.Information.LevelPointInformation.Visible = false;
        STATS_WINDOW.Information.StatInformation.Visible = true;
    },
   
    KnitInit() {
        DataController.statsUpdated.Connect(() => {
            this.refreshStatValues();
        });

        DataController.remainingLPChanged.Connect(() => {
            this.refreshLP();
        });

        STATS_WINDOW.UpgradeOptions.LevelPoints.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.selectStat(undefined);
        });
        
        STATS_WINDOW.UpgradeOptions.PhysicalStrength.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.selectStat("PhysicalStrength");
        });
        
        STATS_WINDOW.UpgradeOptions.MagicProficiency.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.selectStat("MagicProficiency");
        });
        
        STATS_WINDOW.UpgradeOptions.Endurance.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.selectStat("Endurance");
        });

        STATS_WINDOW.UpgradeOptions.Dexterity.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.selectStat("Dexterity");
        });
        
        STATS_WINDOW.UpgradeOptions.Speed.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            this.selectStat("Speed");
        });
        
        STATS_WINDOW.Information.LevelPointInformation.Reset.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            StatsService.resetLevelPoints();
        });
        
        STATS_WINDOW.Information.StatInformation.UpgradeOnce.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            if (this.selectedStat) {
                StatsService.spendLevelPoints(this.selectedStat, 1);
            }
        });
        
        STATS_WINDOW.Information.StatInformation.UpgradeTen.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            if (this.selectedStat) {
                StatsService.spendLevelPoints(this.selectedStat, 10);
            }
        });
        
        STATS_WINDOW.Information.StatInformation.DowngradeOnce.MouseButton1Click.Connect(() => {
            UIController.playSound("Click");
            if (this.selectedStat) {
                StatsService.removeLevelPoints(this.selectedStat, 1);
            }
        });
    }
});

export = StatsTabController;