import { CollectionService, Debris, PathfindingService, Players, RunService, TweenService, Workspace } from "@rbxts/services";
import CharacterService from "server/services/CharacterService";
import CombatService from "server/services/CombatService";
import DungeonService from "server/services/DungeonService";
import MsgService from "server/services/MsgService";
import StatusEffectsService from "server/services/StatusEffectsService";
import TimeLogService from "server/services/TimeLogService";
import InventoryService from "server/services/playerdata/InventoryService";
import StatsService from "server/services/playerdata/StatsService";
import { isLobby } from "shared/utils/Dungeon";
import { getItemsOfTypeInStorage } from "shared/utils/Inventory";
import { generateRandomItem, getStrongestItem } from "shared/utils/Item";
import { getRarityFromName } from "shared/utils/Rarity";
import { ASSETS, BASE_ITEMS, Dungeon, Enemy, Item, STATUS_EFFECTS, WEAPON_ANIMS } from "shared/utils/constants";
import * as BasePartUtils from "shared/utils/vrldk/BasePartUtils";
import * as InstanceUtils from "shared/utils/vrldk/InstanceUtils";
import { abbreviate } from "shared/utils/vrldk/NumberAbbreviations";
import * as PlayerUtils from "shared/utils/vrldk/PlayerUtils";
 
const random = new Random();
const burstDamageDone = new Map<Player, number>();
const loopAnimSeries = new Map<Humanoid, Map<AnimationTrack[], number>>();

const SkillUtils = {
	getHumanoid(player?: Player): Humanoid | undefined {
		return PlayerUtils.getHumanoid(player);
	},
	
	getAnimator(player?: Player): Animator | undefined {
		return PlayerUtils.getAnimator(player);
	},
	
	getHealth(player?: Player): number {
		return PlayerUtils.getHealth(player);
	},
	
	isDead(player?: Player): boolean {
		return PlayerUtils.isDead(player);
	},
	
	isAllPlayersDead(): boolean {
		return PlayerUtils.isAllPlayersDead();
	},

	weld(part0: BasePart, part1: BasePart) {
		return BasePartUtils.weld(part0, part1);
	},

	destroyInstance(instance?: Instance, delayBeforeDestruction?: number) {
		return InstanceUtils.destroyInstance(instance, delayBeforeDestruction);
	},

	timeSinceLastLog(player: Player, key: string) {
		return TimeLogService.timeSinceLastLog(player, key);
	},

	logTime(player: Player, key: string) {
		return TimeLogService.logTime(player, key);
	},

	lastLog(player: Player, key: string) {
		return TimeLogService.lastLog(player, key);
	},

	generateRandomItem(itemID: string) {
		return generateRandomItem(BASE_ITEMS[itemID]);
	},

	getRarityFromName(name?: string) {
		return getRarityFromName(name);
	},

	getRandomEnemyDamage(level: number | undefined, enemy: Enemy, dungeon?: Dungeon, difficulty?: string) {
		return DungeonService.isStarted ? DungeonService.getRandomEnemyDamage(level, enemy, dungeon, difficulty) : 0;
	},

	loadEnemy(enemyModel: Model, pos: CFrame) {
		DungeonService.loadEnemy(enemyModel.Name, pos, enemyModel);
	},

	shakeCamera(player: Player) {
		MsgService.shakeCamera(player);
	},

	shakeAllCameras() {
		MsgService.shakeAllCameras();
	},

	playSlash(player: Player) {
		const wield = InventoryService.getInventory(player).equipment.Weapon.wield as string;
		const animation = new Instance("Animation");
		player.SetAttribute("SlashAnim", player.GetAttribute("SlashAnim") === 0 ? 1 : 0);
		animation.AnimationId = WEAPON_ANIMS[wield].SLASH[player.GetAttribute("SlashAnim") as number];

		const animator = SkillUtils.getAnimator(player);
		if (animator) {
			animator.LoadAnimation(animation).Play();
		}
		SkillUtils.playSoundForClient(player, ASSETS.SkillAssets.WaitForChild("Slash") as Sound);
	},

	getItemsOfType(player: Player, itemType: string) {
		return getItemsOfTypeInStorage(InventoryService.getInventory(player), itemType);
	},

	getStrongestItem(items: Item[], factor: string) {
		return getStrongestItem(items, factor);
	},

	removeItemFromStorage(player: Player, item: Item) {
		return InventoryService.removeItemFromStorage(player, item);
	},

	healHumanoid(player: Player, humanoid: Humanoid, multiplier: number) {
		let base = (StatsService.getStat(player, "Endurance") * multiplier + multiplier) * 100;
		base = math.random(base * 0.95, base * 1.05) / 100;
		if (humanoid.Health + base > humanoid.MaxHealth) {
			base = humanoid.MaxHealth - humanoid.Health;
		}
		humanoid.TakeDamage(-base);
		MsgService.sendNotification(player, "Healed " + abbreviate(base, true) + " HP.", Color3.fromRGB(85, 255, 0));
	},

	changeMana(player: Player, delta: number) {
		CombatService.Client.manaGiven.Fire(player, delta);
	},
	
	damageEnemy(humanoid: Humanoid, player: Player, damage: number, scale: string) {
		if (!humanoid || (!DungeonService.isStarted && !isLobby())) {
			return;
		}

		damage = CharacterService.getBaseDamage(player, scale) * damage;
		damage = damage * ((0.08 * random.NextNumber()) + 0.96);
		let last = burstDamageDone.get(player);
		if (!last) {
			burstDamageDone.set(player, damage);
			last = damage;
		}
		burstDamageDone.set(player, last + damage);
		task.delay(2, () => {
			if (last && burstDamageDone.get(player) === last + damage) {
				burstDamageDone.set(player, 0);
			}
		});

		humanoid.TakeDamage(damage);
		if (humanoid.Health > humanoid.MaxHealth) {
			humanoid.Health = humanoid.MaxHealth;
		}
	},
	
	damagePlayer(player: Player | Humanoid, damage: number) {
		let humanoid;
		let p;
		if (player.IsA("Player") && player.Character) {
			humanoid = player.Character.FindFirstChildOfClass("Humanoid") as Humanoid;
			p = player;
		}
		else {
			humanoid = player as Humanoid;
			p = Players.GetPlayerFromCharacter(humanoid.Parent);
		}
		for (const stacks of StatusEffectsService.getStatusEffectsFolder(humanoid).GetChildren()) {
			const enemyDamage = STATUS_EFFECTS[stacks.Name].Effect.TakingDamage;
			if (enemyDamage) {
				damage = enemyDamage((stacks.GetAttribute("BestAmplifier") as number) ?? 0, damage);
			}
		}
		humanoid.TakeDamage(damage);
	},
	
	enemyAttack(enemy: Enemy, attack: Model, duration: number,
		followingPart?: BasePart) {
		task.spawn(() => {
			const attackParts: BasePart[] = [];
			for (const v of attack.GetChildren()) {
				if (v.Name === "Attack") {
					attackParts.push(v as BasePart);
				}
			}
			if (followingPart && attack.PrimaryPart) {
				for (const v of attackParts) {
					v.Anchored = false;
					const manualWeld = BasePartUtils.weld(v, followingPart);
					task.delay(duration, () => {
						manualWeld.Destroy();
						v.Anchored = true;
					});
				}
				attack.PrimaryPart.CanCollide = false;
				task.spawn(() => {
					SkillUtils.repeatFor(duration, () => {
						attack.PivotTo(followingPart.CFrame);
					});
					attack.PivotTo(followingPart.CFrame);
				});
			}
			const pta: Player[] = [];
			for (const v of attackParts) {
				v.Transparency = 0;
				task.delay(duration, () => {
					v.Material = Enum.Material.Glass;
					v.Transparency = 0.3;
					task.delay(0.4, () => {
						TweenService.Create(v, new TweenInfo(0.7), { Transparency: 1 }).Play();
					});

					const clone = v.Clone();
					clone.Parent = v.Parent;
					clone.Transparency = 1;
					clone.Position = new Vector3(v.Position.X, v.Position.Y + 3, v.Position.Z);
					CombatService.checkDamage(clone, DungeonService.getRandomEnemyDamage(undefined, enemy));
				});
			}
			Debris.AddItem(attack, duration + 1.1);
		});
	},
	
	resizeModel(model: Model, a: number) {
		const base = model.PrimaryPart;

		if (base) {
			for (const part of model.GetDescendants()) {
				if (part.IsA("BasePart")) {
					part.Position = base.Position.Lerp(part.Position, a);
					part.Size = part.Size.mul(a);
				}
			}
		}
		else {
			warn("Model " + tostring(model.Name) + " requires a PrimaryPart to be resized");
		}
	},
	
	tweenModelSize(model: Model, duration: number, factor: number,
		easingStyle: Enum.EasingStyle, easingDirection: Enum.EasingDirection) {
		const s = factor - 1;
		let i = 0;
		let oldAlpha = 0;
		while (i < 1) {
			const [dt] = RunService.Heartbeat.Wait();
			i = math.min(i + dt / duration, 1);
			const alpha = TweenService.GetValue(i, easingStyle, easingDirection);
			SkillUtils.resizeModel(model, (alpha * s + 1) / (oldAlpha * s + 1));
			oldAlpha = alpha;
		}
	},
	
	tweenModelCFrame(model: Model, duration: number, cframe: CFrame) {
		task.spawn(() => {
			if (model.PrimaryPart) {
				const cframeValue = new Instance("CFrameValue");
				cframeValue.Value = model.PrimaryPart.CFrame;
				TweenService.Create(cframeValue, new TweenInfo(duration), { Value: cframe }).Play();
				cframeValue.GetPropertyChangedSignal("Value").Connect(() => {
					model.PivotTo(cframeValue.Value);
				});
				wait(duration);
				model.PivotTo(cframe);
				cframeValue.Destroy();
			}
		});
	},
	
	tweenModelTransparency(model: Model, duration: number, transparency: number) {
		for (const v of model.GetDescendants()) {
			if (v.IsA("BasePart")) {
				TweenService.Create(v, new TweenInfo(duration), { Transparency: transparency }).Play();
			}
		}
	},
	
	playAnimation(player: Player, animationId: string | number): AnimationTrack {
		const humanoid = SkillUtils.getHumanoid(player);
		if (humanoid) {
			const animTrack = SkillUtils.loadAnimation(humanoid, animationId);
			animTrack.Play();
			return animTrack;
		}
		error("Cannot play animation for player " + player.Name);
	},
	
	playNextAnimation(humanoid: Humanoid,
		animationTracks: AnimationTrack[]): AnimationTrack {
		const loop = loopAnimSeries.get(humanoid);
		if (!loop) {
			loopAnimSeries.set(humanoid, new Map());
			return SkillUtils.playNextAnimation(humanoid, animationTracks);
		}
		let pos = loop.get(animationTracks);
		if (!pos) {
			pos = 0;
		}
		const nextAnimTrack = animationTracks[pos];
		nextAnimTrack.Play();
		loop.set(animationTracks, loop.get(animationTracks) ?? 0);
		return nextAnimTrack;
	},
	
	loadAnimation(humanoid: Humanoid, animationId: string | number): AnimationTrack {
		const animation = new Instance("Animation");
		const id = typeOf(animationId) === "number" ? "rbxassetid://" + animationId : animationId as string;
		animation.AnimationId = id;
		return (humanoid.FindFirstChildOfClass("Animator") as Animator).LoadAnimation(animation);
	},
	
	loadAnimations(humanoid: Humanoid, animationIds: string[] | number[]): AnimationTrack[] {
		const animator = humanoid.FindFirstChildOfClass("Animator") as Animator;
		const animTracks = [];
		for (const v of animationIds) {
			const animation = new Instance("Animation");
			animation.AnimationId = typeOf(v) === "number" ? "rbxassetid://" + v : v as string;
			animTracks.push(animator.LoadAnimation(animation));
		}

		return animTracks;
	},
	
	stopAnimation(player: Player, animationId: string) {
		const animator = (SkillUtils.getHumanoid(player) as Humanoid).WaitForChild("Animator") as Animator;

		for (const v of animator.GetPlayingAnimationTracks()) {
			if (v.Animation && v.Animation.AnimationId === animationId) {
				v.Stop();
			}
		}
	},
	
	enableAllParticleEmitters(instance?: Instance, exceptions?: ParticleEmitter[]) {
		if (instance) {
			for (const v of instance.GetDescendants()) {
				if (v.IsA("ParticleEmitter")) {
					if (exceptions && exceptions.includes(v)) {
						continue;
					}
					v.Enabled = true;
				}
			}
		}
	},
	
	disableAllParticleEmitters(instance?: Instance, exceptions?: Instance[]) {
		if (instance) {
			for (const v of instance.GetDescendants()) {
				if (v.IsA("ParticleEmitter") || v.IsA("Fire") || v.IsA("Smoke")) {
					if (exceptions && exceptions.includes(v)) {
						continue;
					}
					v.Enabled = false;
				}
			}
		}
	},
	
	disableBeforeDestroying(particleEmitter: ParticleEmitter,
		delayBeforeDestruction: number, delayBeforeDisable?: number) {
		task.delay(delayBeforeDisable ?? 0, () => {
			particleEmitter.Enabled = false;
			task.delay(delayBeforeDestruction, () => {
				particleEmitter.Destroy();
			});
		});
	},
	
	addTouchInterest(basePart: BasePart): TouchTransmitter | undefined {
		basePart.Touched.Connect(() => { });
		return basePart.FindFirstChildOfClass("TouchTransmitter");
	},
	
	playSoundForClient(player: Player, sound: Sound) {
		const humanoid = SkillUtils.getHumanoid(player);
		if (humanoid) {
			SkillUtils.playSoundAtPart(humanoid.RootPart, sound);
		}
	},
	
	playSoundAtPart(basePart: BasePart | undefined, sound: Sound | string | number,
		volume?: number) {
		if (basePart) {
			if (typeOf(sound) === "Instance") {
				const soundInstance = (sound as Sound).Clone();
				soundInstance.Parent = basePart;
				soundInstance.Name = "sound" + (sound as Sound).SoundId;
				if (volume) {
					soundInstance.Volume = volume;
				}
				soundInstance.Play();
				return;
			}

			const id = typeOf(sound) === "string" ? sound as string : "rbxassetid://" + tostring(sound);
			const cacheSoundInstance = basePart.FindFirstChild("sound_" + id);
			if (cacheSoundInstance && cacheSoundInstance.IsA("Sound")) {
				if (volume) {
					cacheSoundInstance.Volume = volume;
				}
				cacheSoundInstance.Play();
				return;
			}
			const soundInstance = new Instance("Sound", basePart);
			soundInstance.Name = "sound_" + id;
			soundInstance.SoundId = id;
			if (volume) {
				soundInstance.Volume = volume;
			}
			soundInstance.Play();
		}
	},
	
	getHRP(player: Player): BasePart {
		if (player.Character) {
			return player.Character.WaitForChild("HumanoidRootPart") as BasePart;
		}
		else {
			error("Could not get HumanoidRootPart for player " + player.Name);
		}
	},
	
	getHRPCFrame(player: Player): CFrame {
		return SkillUtils.getHRP(player).CFrame;
	},
	
	getRelativeCFrame(player: Player, forward: number,
		right: number, upwards: number): CFrame {
		return SkillUtils.getHRPCFrame(player).mul(new CFrame(right, upwards, -forward));
	},
	
	spawnInstance<T>(instance: Instance & T, cframe: CFrame | undefined,
		anchored: boolean | undefined, addTouch?: boolean): T {
		instance = instance.Clone();
		instance.Parent = Workspace;
		if (cframe) {
			if (instance.IsA("BasePart")) {
				(instance as BasePart).CFrame = cframe;
				(instance as BasePart).Anchored = anchored ? true : false;
				if (addTouch) {
					SkillUtils.addTouchInterest(instance);
				}
			}
			else if (instance.IsA("PVInstance")) {
				instance.PivotTo(cframe);
			}
		}
		return instance;
	},
	
	tweenCFrame(instance: BasePart, duration: number, cframe: CFrame): Tween {
		const tween = TweenService.Create(instance, new TweenInfo(duration), { CFrame: cframe });
		tween.Play();
		return tween;
	},
	
	tweenSize(instance: BasePart, duration: number, size: Vector3): Tween {
		const tween = TweenService.Create(instance, new TweenInfo(duration), { Size: size });
		tween.Play();
		return tween;
	},
	
	tweenTransparency(instance: BasePart | Decal,
		duration: number, transparency: number): Tween {
		const tween = TweenService.Create(instance, new TweenInfo(duration), { Transparency: transparency });
		tween.Play();
		return tween;
	},
	
	getNearbyEnemies(focus: BasePart, range: number): Humanoid[] {
		const enemies = [];
		for (const v of CollectionService.GetTagged("Mob")) {
			const hitbox = v.FindFirstChild("Hitbox");
			const enemyPos = hitbox ? (hitbox as BasePart).Position :
				(v.WaitForChild("Head") as BasePart).Position;

			if (((enemyPos.X - focus.Position.X) * (enemyPos.X - focus.Position.X)) + ((enemyPos.Z - focus.Position.Z) * (enemyPos.Z - focus.Position.Z)) < range * range) { // well this is a cheap way i guess
				enemies.push(v.FindFirstChildOfClass("Humanoid") as Humanoid);
			}
		}
		return enemies;
	},
	
	forNearbyEnemies(focus: BasePart, range: number,
		functionToPerform: (humanoid: Humanoid) => void) {
		for (const v of SkillUtils.getNearbyEnemies(focus, range)) {
			functionToPerform(v);
		}
	},
	
	getTouchingEnemies(focus: BasePart): Humanoid[] {
		SkillUtils.addTouchInterest(focus);
		const humanoids: Humanoid[] = [];
		for (const part of focus.GetTouchingParts()) {
			if (part.Parent) {
				const humanoid = part.Parent.FindFirstChildOfClass("Humanoid");
				if (humanoid && (!Players.FindFirstChild(part.Parent.Name))
					&& (!humanoids.includes(humanoid))) {
					humanoids.push(humanoid);
				}
			}
		}
		return humanoids;
	},
	
	getNearbyPlayers(focus: BasePart, range: number): Humanoid[] {
		const players = [];
		for (const v of Workspace.GetChildren()) {
			if (Players.GetPlayerFromCharacter(v)) {
				const playerPos = ((v as Model).PrimaryPart as BasePart).CFrame;
				if (((playerPos.X - focus.Position.X) * (playerPos.X - focus.Position.X)) + ((playerPos.Z - focus.Position.Z) * (playerPos.Z - focus.Position.Z)) < range * range) { // well this is a cheap way i guess
					players.push(v.FindFirstChildOfClass("Humanoid") as Humanoid);
				}
			}
		}
		return players;
	},
	
	forNearbyPlayers(focus: BasePart, range: number,
		functionToPerform: (humanoid: Humanoid) => void) {
		for (const v of SkillUtils.getNearbyPlayers(focus, range)) {
			functionToPerform(v);
		}
	},
	
	getRandomPlayer(mustBeAlive?: boolean): Player | undefined {
		const players = mustBeAlive ? Players.GetPlayers().filter((player: Player) => {
			return SkillUtils.getHealth(player) > 0;
		}) : Players.GetPlayers();
		return players.size() > 0 ? players[math.random(0, players.size() - 1)] : undefined;
	},
	
	forTouchingEnemies(focus: BasePart, functionToPerform: (humanoid: Humanoid) => void) {
		for (const v of SkillUtils.getTouchingEnemies(focus)) {
			functionToPerform(v);
		}
	},
	
	partBelongsToEnemy(basePart: BasePart): boolean {
		return (basePart.Parent !== undefined && basePart.Parent.FindFirstChild("Enemy") !== undefined);
	},
	
	getEnemyFromPart(basePart: BasePart): Humanoid {
		if (SkillUtils.partBelongsToEnemy(basePart)) {
			const humanoid = (basePart.Parent as Instance).FindFirstChildOfClass("Humanoid");
			if (humanoid) {
				return humanoid;
			}
			error("Humanoid cannot be found in enemy");
		}
		error("Part does not belong to enemy");
	},
	
	createExplosion(position: Vector3, size: number, lifespan: number, color: Color3 | undefined, dontDestroy?: boolean): BasePart {
		const hit = SkillUtils.spawnInstance(ASSETS.SkillAssets.WaitForChild("ExplosionEffect") as BasePart, new CFrame(position), true) as BasePart;
		if (color) {
			hit.Color = color;
		}
		TweenService.Create(hit, new TweenInfo(lifespan * 0.5), { Size: new Vector3(size, size, size) }).Play();
		TweenService.Create(hit, new TweenInfo(lifespan), { Transparency: 1 }).Play();
		if (!dontDestroy) {
			SkillUtils.destroyInstance(hit, lifespan + 1);
		}
		return hit;
	},
	
	pathToTarget(humanoid: Humanoid, destination: Vector3): RBXScriptConnection {
		const path = PathfindingService.CreatePath();
		path.ComputeAsync((humanoid.RootPart as BasePart).Position, destination);

		const waypoints = path.GetWaypoints();
		let index = 1;

		humanoid.MoveTo(waypoints[index].Position);

		return humanoid.MoveToFinished.Connect(() => {
			if (waypoints.size() > index) {
				humanoid.MoveTo(waypoints[index].Position);
				index += 1;
			}
			else {
				humanoid.MoveTo(destination);
			}
		});
	},
	
	fastPathfindToHumanoid(humanoid: Humanoid | undefined, targetHumanoid: Humanoid | undefined, rayCastDistance: number | undefined, 
		previousConnection: RBXScriptConnection | undefined): RBXScriptConnection | undefined {
		if (humanoid && targetHumanoid && humanoid.RootPart && targetHumanoid.RootPart) {
			if (previousConnection) {
				previousConnection.Disconnect();
			}
			return SkillUtils.rayCastPathfindToHumanoid(humanoid, targetHumanoid, rayCastDistance ?? 40);
		}
		return undefined;
	},
	
	rayCastPathfindToHumanoid(humanoid: Humanoid, targetHumanoid: Humanoid,
		rayCastDistance?: number): RBXScriptConnection | undefined {
		humanoid.MoveTo((targetHumanoid.RootPart as BasePart).Position, targetHumanoid.RootPart);
		/* if (humanoid.RootPart && targetHumanoid.RootPart && humanoid.Parent && targetHumanoid.Parent) {
			const current = humanoid.RootPart.Position;
			const destination = targetHumanoid.RootPart.Position;
			const params = new RaycastParams();
			params.AddToFilter(humanoid.Parent);
			const res = Workspace.Raycast(current, (destination.sub(current)).Unit.mul(rayCastDistance ?? 50), params);
			if (res?.Instance) {
				if (res.Instance.IsDescendantOf(targetHumanoid.Parent)) {
					humanoid.MoveTo(destination, targetHumanoid.RootPart);
				}
				else { 
					return SkillUtils.pathToTarget(humanoid, destination);
				}
			}
		} */
		return undefined;
	},

	getEnemyFromHumanoid(humanoid: Humanoid) {
		return humanoid.Parent ? DungeonService.getEnemy(humanoid.Parent.Name) : undefined;
	},

	refreshEnemy(humanoid: Humanoid) {
		StatusEffectsService.removeStacks(humanoid, "Stop");
	},

	addStatusEffectToEnemy(humanoid: Humanoid, ID: string, duration: number, multiplier: number) {
		StatusEffectsService.addStack(humanoid, ID, multiplier, duration);
	},

	stopMovement(humanoid: Humanoid) {
		this.addStatusEffectToEnemy(humanoid, "Stop", 999, 1);
	},

	addStatusEffect(player: Player, ID: string, duration: number, multiplier: number) {
		const humanoid = this.getHumanoid(player);
		if (humanoid) {
			StatusEffectsService.addStack(humanoid, ID, multiplier, duration);
		}
	},
	
	addResistance(player: Player, multiplier: number, duration: number) {
		SkillUtils.addStatusEffect(player, "Resistance", duration, multiplier);
	},

	addVulnerable(player: Player, multiplier: number, duration: number) {
		SkillUtils.addStatusEffect(player, "Vulnerable", duration, multiplier);
	},
	
	addSpeedBoost(player: Player, multiplier: number, duration: number) {
		SkillUtils.addStatusEffect(player, "Speed", duration, multiplier);
	},

	addSlowness(player: Player, multiplier: number, duration: number) {
		SkillUtils.addStatusEffect(player, "Slowness", duration, multiplier);
	},
	
	repeatFor(seconds: number, thread: () => void) {
		const start = tick();
		const connection = RunService.Heartbeat.Connect((deltaTime: number) => {
			if (tick() < start + seconds) {
				thread();
			}
			else {
				connection.Disconnect();
			}
		});
		wait(seconds);
	},

	sendHotbarNotification(player: Player, message: string, color?: Color3) {
		return MsgService.sendHotbarNotification(player, message, color);
	},

	sendNotification(player: Player, message: string, color: Color3) {
		return MsgService.sendNotification(player, message, color);
	},
}

export = SkillUtils;