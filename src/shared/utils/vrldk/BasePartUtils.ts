export function weld(part0: BasePart, part1: BasePart) {
	const w = new Instance("ManualWeld", part0);
	w.Name = part0.Name + "_Weld_" + part1.Name;
	w.C0 = part0.CFrame.Inverse().mul(part1.CFrame);
	w.Part0 = part0;
	w.Part1 = part1;
	return w;
}

export function playSoundAtPart(basePart: BasePart | undefined, sound: Sound | string | number, volume?: number) {
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
		const cacheSoundInstance = basePart.FindFirstChild("sound" + id);
		if (cacheSoundInstance && cacheSoundInstance.IsA("Sound")) {
			if (volume) {
				cacheSoundInstance.Volume = volume;
			}
			cacheSoundInstance.Play();
			return;
		}
		const soundInstance = new Instance("Sound");
		soundInstance.Name = "sound" + id;
		soundInstance.SoundId = id;
		soundInstance.Parent = basePart;
		if (volume) {
			soundInstance.Volume = volume;
		}
		soundInstance.Play();
	}
}

export function addTouchInterest(basePart: BasePart): TouchTransmitter | undefined {
	basePart.Touched.Connect(() => { });
	return basePart.FindFirstChildOfClass("TouchTransmitter");
}

export function getHumanoidsInArea(humanoids: Humanoid[], area: BasePart) {
	area.Touched.Connect(() => {});
	const inArea: Humanoid[] = [];
	for (const otherPart of area.GetTouchingParts()) {
		if (otherPart.Parent) {
			const humanoid = otherPart.Parent.FindFirstChildOfClass("Humanoid");
			if (humanoid && humanoids.includes(humanoid)) {
				inArea.push(humanoid);
			}
		}
	}
	return inArea;
}