import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { useComputedColorScheme } from "@mantine/core";

export function useCodeMirrorTheme() {
	const colorScheme = useComputedColorScheme("light");
	return colorScheme === "dark" ? vscodeDark : vscodeLight;
}
