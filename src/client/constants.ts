import { Players } from "@rbxts/services";
import Skill, { Bar, Item, UI_ASSETS } from "shared/utils/constants";

export const LOCAL_PLAYER = Players.LocalPlayer;
export const MOUSE = LOCAL_PLAYER.GetMouse();
export const PLAYER_GUI = LOCAL_PLAYER.WaitForChild("PlayerGui") as StarterGui;

export interface InventorySortType {
    getLayoutOrder: (item: Item) => number;
}

export type InventorySortOrder = number;

export const INVENTORY_SORT_TYPES: {[ID: string]: InventorySortType} = {
	LEVEL_REQUIREMENT: {
		getLayoutOrder: (item: Item) => {
			return item.levelReq ?? 1;
        }
	},
	RARITY: {
		getLayoutOrder: (item: Item) => {
			return item.rarity ? item.rarity.multiplier * 10 : 0;
        }
	}
};

export const INVENTORY_SORT_ORDER: {[ID: string]: InventorySortOrder} = {
	ASCENDING: 1,
	DESCENDING: -1
}

export type Slot = CanvasGroup & {
    Button: TextButton & {
		UIStroke: UIStroke,
	},
    Thumbnail: ImageLabel
};
export interface SlotContainer {
	Slot: Slot, 
	MouseEnterConnection: RBXScriptConnection, 
	MouseLeaveConnection: RBXScriptConnection, 
	MouseClickConnection: RBXScriptConnection
}

export type ItemSlot = Slot & {
    TierLabel: TextLabel,
    ViewportThumbnail: ViewportFrame,
};
export type ItemSlotContainer = SlotContainer & {Slot: ItemSlot, Item: Item};
export type SkillSlot = Slot;
export type SkillSlotContainer = SlotContainer & {Slot: SkillSlot, Skill: Skill};

export type SkillTreeTrack = Frame & {
	UIListLayout: UIListLayout;
}

export type PartySlot = Frame & {
	DungeonNameLabel: TextLabel;
	PublicityLabel: TextLabel & {
		UIStroke: UIStroke;
	};
	JoinButton: TextButton;
	PlayerNameLabel: TextLabel;
	LevelRequirementLabel: TextLabel;
}

export type PartyPlayerSlot = Frame & {
	LevelLabel: TextLabel;
	InspectButton: TextButton;
	UICorner: UICorner;
	UIStroke: UIStroke;
	PlayerNameLabel: TextLabel;
	KickButton: TextButton;
}

export type CosmeticOption = TextButton & {
	NameLabel: TextLabel
}

export const ASSETS = UI_ASSETS.WaitForChild("Client") as Folder & {
	ItemGetSound: Sound;
	SkillsWindow: Folder & {
		Track: SkillTreeTrack;
		Skill: SkillSlot;
	};
	ClickSound: Sound;
	QuestsWindow: Folder & {
		RequirementSlot: TextLabel;
		RewardSlot: TextLabel;
	};
	PlayerListWindow: Folder & {
		PlayerSlot: PlayerSlot
	};
	PlayWindow: Folder & {
		PartySlot: PartySlot;
		PlayerSlot: PartyPlayerSlot;
	};
	Slot: ItemSlot;
	ErrorSound: Sound;
	NotificationSlot: Frame & {
		MessageLabel: TextLabel;
	};
	CosmeticOption: TextButton & {
		NameLabel: TextLabel
	}
}

export const INTERFACE = PLAYER_GUI.WaitForChild("Interface") as ScreenGui;

export const ANNOUNCEMENT_LABEL = INTERFACE.WaitForChild("AnnouncementLabel") as TextLabel;

export type PlayerSlot = Frame & {
	NameLabel: TextLabel
	Player: ObjectValue;
	OpenOptions: TextButton;
	LevelLabel: TextLabel;
};

export const CLASS_SELECTION_WINDOW = INTERFACE.WaitForChild("ClassSelectionWindow") as CanvasGroup & {
	Options: Frame & {
		Mage: ImageButton,
		Warrior: ImageButton
	}
}

export const PLAYER_LIST_WINDOW = INTERFACE.WaitForChild("PlayerListWindow") as Frame & {
	InteractionOptions: Frame & {
		InspectSelected: TextButton,
		TradeSelected: TextButton,
		ReportSelected: TextButton,
	},
	ExtendingWindow: Frame & {
		PlayerList: ScrollingFrame & {[key: string]: PlayerSlot}
	},
	TogglePlayerList: TextButton
};

export const TRADE_REQUEST_WINDOW = INTERFACE.WaitForChild("TradeRequestWindow") as Frame & {
	AcceptRequest: TextButton,
	DeclineRequest: TextButton,
	NameLabel: TextLabel
};
export const SIDEBAR_BUTTONS = INTERFACE.WaitForChild("SidebarButtons") as Frame;

export const HOTBAR = INTERFACE.WaitForChild("Hotbar") as Frame & {
    PlayerInfo: Frame & {
        LevelContainer: Frame & {
            LevelLabel: TextLabel
        }
        Thumbnail: ImageLabel
    },
	Gold: Frame & {
		GoldLabel: TextLabel
	},
	MiniAnnouncementLabel: TextLabel,
	CancelEquip: TextButton
};

export type HotbarSlot = ImageButton & {
    ColorFrame: Frame & {
        UIStroke: UIStroke
    },
    CooldownAnimFrame: Frame,
    CooldownLabel: TextLabel,
	HotkeyLabel: TextLabel
}

export const HOTBAR_SLOTS = HOTBAR.WaitForChild("Slots") as Frame & {
    Slot1: HotbarSlot,
    Slot2: HotbarSlot,
    Slot3: HotbarSlot,
    Slot4: HotbarSlot,
    Slot5: HotbarSlot,
};
export const MANA_BAR = HOTBAR.WaitForChild("ManaBar") as Bar;
export const MANA_BAR_VALUE_LABEL = MANA_BAR.WaitForChild("ValueLabel") as TextLabel;
export const MANA_BAR_EXTENDING_BAR = MANA_BAR.WaitForChild("ExtendingBar") as Frame;
export const HEALTH_BAR = HOTBAR.WaitForChild("HealthBar") as Bar;
export const HEALTH_BAR_VALUE_LABEL = HEALTH_BAR.WaitForChild("ValueLabel") as TextLabel;
export const HEALTH_BAR_EXTENDING_BAR = HEALTH_BAR.WaitForChild("ExtendingBar") as Frame;
export const EXPERIENCE_BAR = HOTBAR.WaitForChild("ExperienceBar") as Bar;
export const EXPERIENCE_BAR_VALUE_LABEL = EXPERIENCE_BAR.WaitForChild("ValueLabel") as TextLabel;
export const EXPERIENCE_BAR_EXTENDING_BAR = EXPERIENCE_BAR.WaitForChild("ExtendingBar") as Frame;

export const ADAPTIVE_TAB = INTERFACE.WaitForChild("AdaptiveTab") as Frame & {
    CloseButton: TextButton,
};
export const ADAPTIVE_TAB_MAIN_WINDOW = ADAPTIVE_TAB.WaitForChild("MainWindow") as Frame & {
	UIStroke: UIStroke & {
		UIGradient: UIGradient
	}
};
export type AdaptiveTabWindow = Frame & {
    Color: Color3Value,
	Color2: Color3Value
} 
export const TRADE_WINDOW = ADAPTIVE_TAB_MAIN_WINDOW.WaitForChild("Trade") as AdaptiveTabWindow & {
    TraderAcceptanceLabel: TextLabel;
	TraderItems: ScrollingFrame;
	AcceptTrade: TextButton;
	YourItems: ScrollingFrame;
	CountdownLabel: TextLabel;
	PlayerNameLabel: TextLabel;
	SelfAcceptanceLabel: TextLabel;
};

export type AvatarView = Frame & {
	Helmet: ItemSlot;
	Chestplate: ItemSlot;		
	Weapon: ItemSlot;
}

export const ITEMS_WINDOW = ADAPTIVE_TAB_MAIN_WINDOW.WaitForChild("Items") as AdaptiveTabWindow & {
    StorageView: ScrollingFrame;
	AvatarView: AvatarView;
	SortOptions: Frame & {
		SortLevel: TextButton;
		SortForm: TextButton & {
			OrderLabel: TextLabel;
		};
		SortRarity: TextButton;
	};
	UpgradeWindow: Frame & {
		Cost: Frame & {
			ValueLabel: TextLabel
		};
		UpgradeOptions: Frame & {
			Once: TextButton;
			Variable: TextButton & { DeltaLabel: TextLabel };
			Maximum: TextButton;
		};
		Upgrade: TextButton & { DeltaLabel: TextLabel };
	};
	DefaultWindow: Frame & {
		CosmeticLabel: TextLabel,
		CosmeticsOptions: ScrollingFrame,
		InteractionOptions: Frame & {
			Unequip: TextButton;
			Equip: TextButton;
		};
	};
	SellWindow: Frame & {
		SellOptions: Frame & {
			SelectedOnly: TextButton & {
				CostLabel: TextLabel;
            };
		};
	};
};

export const SKILLS_WINDOW = ADAPTIVE_TAB_MAIN_WINDOW.WaitForChild("Skills") as AdaptiveTabWindow & {
	Options: Frame & {
		TreeOptions: Frame & {
			Respec: TextButton;
		};
		RemainingSPLabel: TextLabel;
		SelectionOptions: Frame & {
			Equip: TextButton;
			Learn: TextButton;
		};
	}
	TreeView: ScrollingFrame;
};

export type StatUpgradeOption = TextButton & {
	ValueLabel: TextLabel & {
		UIStroke: UIStroke & {
			UIGradient: UIGradient;
		};
	};
}

export const STATS_WINDOW = ADAPTIVE_TAB_MAIN_WINDOW.WaitForChild("Stats") as AdaptiveTabWindow & {
	Color: Color3Value;
	UpgradeOptions: Frame & {
		Dexterity: StatUpgradeOption;
		Endurance: StatUpgradeOption;
		LevelPoints: StatUpgradeOption;
		Speed: StatUpgradeOption;
		PhysicalStrength: StatUpgradeOption;
		MagicProficiency: StatUpgradeOption;
	};
	Information: Frame & {
		LevelPointInformation: Frame & {
			Reset: TextButton,
			RemainingLevelPoints: TextLabel,
			TotalLevelPoints: TextLabel,
		},
		StatInformation: Frame & {
			DescriptionLabel: TextLabel,
			UpgradeOnce: TextButton,
			UpgradeTen: TextButton,
			DowngradeOnce: TextButton,
		},
		NameLabel: TextLabel
	};
};
export const SETTINGS_WINDOW = ADAPTIVE_TAB_MAIN_WINDOW.WaitForChild("Settings") as AdaptiveTabWindow & {
	InteractionOptions: Frame & {
		ShowTradeRequests: Frame & {
			Toggle: TextButton;
		};
		ClearData: Frame & {
			Once: TextButton;
		};
		Codes: Frame & {
			Enter: TextButton;
			Input: TextBox;
		};
		MusicVolume: Frame & {
			Toggle: TextButton;
		};
	};
}
;
export const PLAY_WINDOW = ADAPTIVE_TAB_MAIN_WINDOW.WaitForChild("Play") as AdaptiveTabWindow & {
	PartySearcherWindow: Frame & {
		PartyList: ScrollingFrame & {
			[key: string]: PartySlot;
		};
		Refresh: TextButton;
		SwitchToDungeonSelection: TextButton;
	};
	DungeonSelectionWindow: Frame & {
		DifficultyLabel: TextLabel & {
			UIStroke: UIStroke;
		};
		DescriptionLabel: TextLabel;
		NameLabel: TextLabel;
		LevelRequirementLabel: TextLabel;
		DungeonOptions: Frame & {
			[dungeonID: string]: TextButton;
		};
		SearchParties: TextButton;
		InsaneModeDescriptionLabel: TextLabel;
		InsaneMode: TextButton;
		DifficultyOptions: Frame & {
			[difficulty: string]: TextButton;
		};
		CreateParty: TextButton;
	};
	InPartyWindow: Frame & {
		Leave: TextButton;
		PlayerList: ScrollingFrame & {
			[key: string]: PartyPlayerSlot;
		};
		DifficultyLabel: TextLabel & {
			UIStroke: UIStroke;
		};
		Start: TextButton;
		NameLabel: TextLabel;
	};
};

export const ANALYZE_WINDOW = INTERFACE.WaitForChild("AnalyzeWindow") as AdaptiveTabWindow & {
    Item: Frame & {
		MagicalPowerLabel: TextLabel;
		DescriptionLabel: TextLabel;
		ItemThumbnail: ImageLabel;
		LevelRequirementLabel: TextLabel;
		HealthLabel: TextLabel;
		PhysicalPowerLabel: TextLabel;
		SellValueLabel: TextLabel;
		UpgradesLabel: TextLabel;
		NameLabel: TextLabel;
	};
	Skill: Frame & {
		MagicalPowerLabel: TextLabel;
		NameLabel: TextLabel;
		SPCostLabel: TextLabel;
		DescriptionLabel: TextLabel;
		UIListLayout: UIListLayout;
		PhysicalPowerLabel: TextLabel;
		ManaCostLabel: TextLabel;
		CooldownLabel: TextLabel;
	};
	UIGradient: UIGradient;
};

export const LOADING_WINDOW = INTERFACE.WaitForChild("LoadingWindow") as CanvasGroup & {
	StatusLabel: TextLabel & {
		UIStroke: UIStroke;
	};
	Logo: ImageLabel;
	Glow: ImageLabel;
	TitleLabel: TextLabel;
	SkipButton: TextButton;
}

export const TELEPORT_INTERMISSION_WINDOW = INTERFACE.WaitForChild("TeleportIntermissionWindow") as Frame & {
	DungeonThumbnail: ImageLabel & {
		DungeonDifficultyLabel: TextLabel & {
			UIStroke: UIStroke;
		};
		DungeonNameLabel: TextLabel;
	};
}

export const TRACKED_QUEST_WINDOW = INTERFACE.WaitForChild("TrackedQuestWindow") as Frame & {
	NameLabel: TextLabel;
	DescriptionLabel: TextLabel;
}

export const INSPECT_WINDOW = ADAPTIVE_TAB_MAIN_WINDOW.WaitForChild("Inspect") as AdaptiveTabWindow & {
	PlayerNameLabel: TextLabel;
	AvatarView: Frame & {
		[key: string]: ItemSlot;
	};
}

export type SnowflakeOptions = Frame & {
	Label: Frame & {
		SnowflakesLabel: TextLabel
	},
	BuySnowflakes: TextButton
}

export const EVENT_WINDOW = ADAPTIVE_TAB_MAIN_WINDOW.WaitForChild("Event") as AdaptiveTabWindow & {
	ShopOptions: ScrollingFrame & {
		[cosmeticID: string]: EventShopOption
	},
	SnowflakeOptions: SnowflakeOptions
}

export type EventShopOption = TextButton & {
	CostLabel: Frame & {
		SnowflakesLabel: TextLabel
	},
	BoughtLabel: TextLabel,
	CosmeticNameLabel: TextLabel
}

export const SNOWFLAKES_WINDOW = ADAPTIVE_TAB_MAIN_WINDOW.WaitForChild("Snowflakes") as AdaptiveTabWindow & {
	ShopOptions: Frame & {
		[shopOption: number]: SnowflakesPurchaseOption
	},
	SnowflakeOptions: SnowflakeOptions
}

export type SnowflakesPurchaseOption = TextButton & {
	Amount: Frame & {
		SnowflakesLabel: TextLabel
	},
	Cost: Frame & {
		Label: TextLabel,
		CostLabel: TextLabel
	}
}

export const TOGGLE_SHIFT_LOCK = INTERFACE.WaitForChild("ToggleShiftLock") as TextButton & {
	UIStroke: UIStroke;
};

export const REWARD_DISPLAYER_WINDOW = INTERFACE.WaitForChild("RewardDisplayerWindow") as Frame & {
	ItemsList: Frame & {[key: string]: ItemSlot},
	GoldGainedLabel: TextLabel
};

export const IN_DUNGEON = INTERFACE.WaitForChild("InDungeon");

export const BOSS_LABEL = INTERFACE.WaitForChild("BossLabel") as Frame & {
	HealthBar: Bar,
	NameLabel: TextLabel
};

export const TIMER_WINDOW = IN_DUNGEON.WaitForChild("TimerWindow") as Frame & {
	Death: TextLabel,
	TimeLabel: TextLabel
};

export const START_BUTTON = IN_DUNGEON.WaitForChild("StartButton") as TextButton;